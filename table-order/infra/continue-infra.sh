#!/bin/bash
set -e
export AWS_DEFAULT_REGION=us-east-1

VPC_ID=vpc-009237b5a51a99c74
IGW_ID=igw-09354d2984a930dcf
PUB_SUB_1=subnet-047b9d9f5158881db
PUB_SUB_2=subnet-06a21ecb6befdf002
PRIV_EKS_SUB_1=subnet-0cccc44fa189544cb
PRIV_EKS_SUB_2=subnet-0d870aa5053a72bb6
PRIV_DB_SUB_1=subnet-0cef2a2ad5dd7accd
PRIV_DB_SUB_2=subnet-03018fde169664ee6

echo "=== Allocating EIP ==="
EIP_ALLOC=$(aws ec2 allocate-address --domain vpc --query AllocationId --output text)
echo "EIP: $EIP_ALLOC"

echo "=== Creating NAT Gateway ==="
NAT_GW=$(aws ec2 create-nat-gateway --subnet-id $PUB_SUB_1 --allocation-id $EIP_ALLOC --tag-specifications 'ResourceType=natgateway,Tags=[{Key=Name,Value=table-order-nat}]' --query 'NatGateway.NatGatewayId' --output text)
echo "NAT GW: $NAT_GW — waiting for available..."
aws ec2 wait nat-gateway-available --nat-gateway-ids $NAT_GW
echo "NAT GW ready!"

echo "=== Creating Route Tables ==="
PUB_RT=$(aws ec2 create-route-table --vpc-id $VPC_ID --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=table-order-public-rt}]' --query 'RouteTable.RouteTableId' --output text)
aws ec2 create-route --route-table-id $PUB_RT --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW_ID > /dev/null
aws ec2 associate-route-table --route-table-id $PUB_RT --subnet-id $PUB_SUB_1 > /dev/null
aws ec2 associate-route-table --route-table-id $PUB_RT --subnet-id $PUB_SUB_2 > /dev/null
echo "Public RT: $PUB_RT"

PRIV_RT=$(aws ec2 create-route-table --vpc-id $VPC_ID --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=table-order-private-rt}]' --query 'RouteTable.RouteTableId' --output text)
aws ec2 create-route --route-table-id $PRIV_RT --destination-cidr-block 0.0.0.0/0 --nat-gateway-id $NAT_GW > /dev/null
aws ec2 associate-route-table --route-table-id $PRIV_RT --subnet-id $PRIV_EKS_SUB_1 > /dev/null
aws ec2 associate-route-table --route-table-id $PRIV_RT --subnet-id $PRIV_EKS_SUB_2 > /dev/null
echo "Private RT (EKS): $PRIV_RT"

DB_RT=$(aws ec2 create-route-table --vpc-id $VPC_ID --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=table-order-db-rt}]' --query 'RouteTable.RouteTableId' --output text)
aws ec2 associate-route-table --route-table-id $DB_RT --subnet-id $PRIV_DB_SUB_1 > /dev/null
aws ec2 associate-route-table --route-table-id $DB_RT --subnet-id $PRIV_DB_SUB_2 > /dev/null
echo "DB RT (isolated): $DB_RT"

echo "=== Creating Security Groups ==="
ALB_SG=$(aws ec2 create-security-group --group-name table-order-alb-sg --description "ALB public tier" --vpc-id $VPC_ID --query GroupId --output text)
aws ec2 authorize-security-group-ingress --group-id $ALB_SG --protocol tcp --port 80 --cidr 0.0.0.0/0 > /dev/null
aws ec2 authorize-security-group-ingress --group-id $ALB_SG --protocol tcp --port 443 --cidr 0.0.0.0/0 > /dev/null
aws ec2 create-tags --resources $ALB_SG --tags Key=Name,Value=table-order-alb-sg
echo "ALB SG: $ALB_SG"

EKS_SG=$(aws ec2 create-security-group --group-name table-order-eks-sg --description "EKS private tier" --vpc-id $VPC_ID --query GroupId --output text)
aws ec2 authorize-security-group-ingress --group-id $EKS_SG --protocol tcp --port 8081 --source-group $ALB_SG > /dev/null
aws ec2 authorize-security-group-ingress --group-id $EKS_SG --protocol tcp --port 8082 --source-group $ALB_SG > /dev/null
aws ec2 authorize-security-group-ingress --group-id $EKS_SG --protocol tcp --port 80 --source-group $ALB_SG > /dev/null
aws ec2 authorize-security-group-ingress --group-id $EKS_SG --protocol tcp --port 0-65535 --source-group $EKS_SG > /dev/null
aws ec2 create-tags --resources $EKS_SG --tags Key=Name,Value=table-order-eks-sg
echo "EKS SG: $EKS_SG"

RDS_SG=$(aws ec2 create-security-group --group-name table-order-rds-sg --description "RDS isolated tier" --vpc-id $VPC_ID --query GroupId --output text)
aws ec2 authorize-security-group-ingress --group-id $RDS_SG --protocol tcp --port 5432 --source-group $EKS_SG > /dev/null
aws ec2 create-tags --resources $RDS_SG --tags Key=Name,Value=table-order-rds-sg
echo "RDS SG: $RDS_SG"

echo ""
echo "========================================="
echo "VPC networking complete!"
echo "========================================="
echo "VPC_ID=$VPC_ID"
echo "NAT_GW=$NAT_GW"
echo "ALB_SG=$ALB_SG"
echo "EKS_SG=$EKS_SG"
echo "RDS_SG=$RDS_SG"
echo "PUB_RT=$PUB_RT"
echo "PRIV_RT=$PRIV_RT"
echo "DB_RT=$DB_RT"
echo "========================================="
echo ""
echo "=== Creating EKS Cluster ==="
eksctl create cluster \
  --name table-order-cluster \
  --region us-east-1 \
  --version 1.28 \
  --vpc-private-subnets $PRIV_EKS_SUB_1,$PRIV_EKS_SUB_2 \
  --vpc-public-subnets $PUB_SUB_1,$PUB_SUB_2 \
  --node-type t3.medium \
  --nodes 2 \
  --nodes-min 2 \
  --nodes-max 5 \
  --managed \
  --with-oidc \
  --alb-ingress-access \
  --full-ecr-access

echo "========================================="
echo "EKS Cluster created!"
echo "========================================="
