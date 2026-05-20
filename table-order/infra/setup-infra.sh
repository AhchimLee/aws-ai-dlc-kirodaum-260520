#!/bin/bash
set -e

REGION="us-east-1"
PROJECT="table-order"
VPC_CIDR="10.0.0.0/16"

# AZ 2개
AZ1="us-east-1a"
AZ2="us-east-1b"

# 서브넷 CIDR
PUBLIC_SUBNET_1_CIDR="10.0.1.0/24"
PUBLIC_SUBNET_2_CIDR="10.0.2.0/24"
PRIVATE_EKS_SUBNET_1_CIDR="10.0.11.0/24"
PRIVATE_EKS_SUBNET_2_CIDR="10.0.12.0/24"
PRIVATE_DB_SUBNET_1_CIDR="10.0.21.0/24"
PRIVATE_DB_SUBNET_2_CIDR="10.0.22.0/24"

echo "=== Creating VPC ==="
VPC_ID=$(aws ec2 create-vpc \
  --cidr-block $VPC_CIDR \
  --tag-specifications "ResourceType=vpc,Tags=[{Key=Name,Value=${PROJECT}-vpc},{Key=Project,Value=${PROJECT}}]" \
  --region $REGION \
  --query 'Vpc.VpcId' --output text)
echo "VPC: $VPC_ID"

aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-hostnames --region $REGION
aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-support --region $REGION

echo "=== Creating Internet Gateway ==="
IGW_ID=$(aws ec2 create-internet-gateway \
  --tag-specifications "ResourceType=internet-gateway,Tags=[{Key=Name,Value=${PROJECT}-igw}]" \
  --region $REGION \
  --query 'InternetGateway.InternetGatewayId' --output text)
echo "IGW: $IGW_ID"

aws ec2 attach-internet-gateway --internet-gateway-id $IGW_ID --vpc-id $VPC_ID --region $REGION

echo "=== Creating Public Subnets ==="
PUB_SUB_1=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID --cidr-block $PUBLIC_SUBNET_1_CIDR --availability-zone $AZ1 \
  --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${PROJECT}-public-1},{Key=kubernetes.io/role/elb,Value=1}]" \
  --region $REGION --query 'Subnet.SubnetId' --output text)
echo "Public Subnet 1: $PUB_SUB_1"

PUB_SUB_2=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID --cidr-block $PUBLIC_SUBNET_2_CIDR --availability-zone $AZ2 \
  --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${PROJECT}-public-2},{Key=kubernetes.io/role/elb,Value=1}]" \
  --region $REGION --query 'Subnet.SubnetId' --output text)
echo "Public Subnet 2: $PUB_SUB_2"

aws ec2 modify-subnet-attribute --subnet-id $PUB_SUB_1 --map-public-ip-on-launch --region $REGION
aws ec2 modify-subnet-attribute --subnet-id $PUB_SUB_2 --map-public-ip-on-launch --region $REGION

echo "=== Creating Private EKS Subnets ==="
PRIV_EKS_SUB_1=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID --cidr-block $PRIVATE_EKS_SUBNET_1_CIDR --availability-zone $AZ1 \
  --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${PROJECT}-private-eks-1},{Key=kubernetes.io/role/internal-elb,Value=1}]" \
  --region $REGION --query 'Subnet.SubnetId' --output text)
echo "Private EKS Subnet 1: $PRIV_EKS_SUB_1"

PRIV_EKS_SUB_2=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID --cidr-block $PRIVATE_EKS_SUBNET_2_CIDR --availability-zone $AZ2 \
  --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${PROJECT}-private-eks-2},{Key=kubernetes.io/role/internal-elb,Value=1}]" \
  --region $REGION --query 'Subnet.SubnetId' --output text)
echo "Private EKS Subnet 2: $PRIV_EKS_SUB_2"

echo "=== Creating Private DB Subnets ==="
PRIV_DB_SUB_1=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID --cidr-block $PRIVATE_DB_SUBNET_1_CIDR --availability-zone $AZ1 \
  --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${PROJECT}-private-db-1}]" \
  --region $REGION --query 'Subnet.SubnetId' --output text)
echo "Private DB Subnet 1: $PRIV_DB_SUB_1"

PRIV_DB_SUB_2=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID --cidr-block $PRIVATE_DB_SUBNET_2_CIDR --availability-zone $AZ2 \
  --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${PROJECT}-private-db-2}]" \
  --region $REGION --query 'Subnet.SubnetId' --output text)
echo "Private DB Subnet 2: $PRIV_DB_SUB_2"

echo "=== Creating NAT Gateway ==="
EIP_ALLOC=$(aws ec2 allocate-address --domain vpc --region $REGION --query 'AllocationId' --output text)
echo "EIP: $EIP_ALLOC"

NAT_GW=$(aws ec2 create-nat-gateway \
  --subnet-id $PUB_SUB_1 --allocation-id $EIP_ALLOC \
  --tag-specifications "ResourceType=natgateway,Tags=[{Key=Name,Value=${PROJECT}-nat}]" \
  --region $REGION --query 'NatGateway.NatGatewayId' --output text)
echo "NAT Gateway: $NAT_GW"
echo "Waiting for NAT Gateway to become available..."
aws ec2 wait nat-gateway-available --nat-gateway-ids $NAT_GW --region $REGION

echo "=== Creating Route Tables ==="
# Public Route Table
PUB_RT=$(aws ec2 create-route-table \
  --vpc-id $VPC_ID \
  --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=${PROJECT}-public-rt}]" \
  --region $REGION --query 'RouteTable.RouteTableId' --output text)
aws ec2 create-route --route-table-id $PUB_RT --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW_ID --region $REGION
aws ec2 associate-route-table --route-table-id $PUB_RT --subnet-id $PUB_SUB_1 --region $REGION
aws ec2 associate-route-table --route-table-id $PUB_RT --subnet-id $PUB_SUB_2 --region $REGION
echo "Public RT: $PUB_RT"

# Private Route Table (EKS - with NAT)
PRIV_RT=$(aws ec2 create-route-table \
  --vpc-id $VPC_ID \
  --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=${PROJECT}-private-rt}]" \
  --region $REGION --query 'RouteTable.RouteTableId' --output text)
aws ec2 create-route --route-table-id $PRIV_RT --destination-cidr-block 0.0.0.0/0 --nat-gateway-id $NAT_GW --region $REGION
aws ec2 associate-route-table --route-table-id $PRIV_RT --subnet-id $PRIV_EKS_SUB_1 --region $REGION
aws ec2 associate-route-table --route-table-id $PRIV_RT --subnet-id $PRIV_EKS_SUB_2 --region $REGION
echo "Private RT (EKS): $PRIV_RT"

# DB Route Table (isolated - no internet)
DB_RT=$(aws ec2 create-route-table \
  --vpc-id $VPC_ID \
  --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=${PROJECT}-db-rt}]" \
  --region $REGION --query 'RouteTable.RouteTableId' --output text)
aws ec2 associate-route-table --route-table-id $DB_RT --subnet-id $PRIV_DB_SUB_1 --region $REGION
aws ec2 associate-route-table --route-table-id $DB_RT --subnet-id $PRIV_DB_SUB_2 --region $REGION
echo "DB RT (isolated): $DB_RT"

echo "=== Creating Security Groups ==="
# ALB Security Group
ALB_SG=$(aws ec2 create-security-group \
  --group-name "${PROJECT}-alb-sg" --description "ALB - public tier" \
  --vpc-id $VPC_ID --region $REGION --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --group-id $ALB_SG --protocol tcp --port 80 --cidr 0.0.0.0/0 --region $REGION
aws ec2 authorize-security-group-ingress --group-id $ALB_SG --protocol tcp --port 443 --cidr 0.0.0.0/0 --region $REGION
aws ec2 create-tags --resources $ALB_SG --tags Key=Name,Value=${PROJECT}-alb-sg --region $REGION
echo "ALB SG: $ALB_SG"

# EKS Node Security Group
EKS_SG=$(aws ec2 create-security-group \
  --group-name "${PROJECT}-eks-sg" --description "EKS nodes - private tier" \
  --vpc-id $VPC_ID --region $REGION --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --group-id $EKS_SG --protocol tcp --port 8081 --source-group $ALB_SG --region $REGION
aws ec2 authorize-security-group-ingress --group-id $EKS_SG --protocol tcp --port 8082 --source-group $ALB_SG --region $REGION
aws ec2 authorize-security-group-ingress --group-id $EKS_SG --protocol tcp --port 80 --source-group $ALB_SG --region $REGION
aws ec2 authorize-security-group-ingress --group-id $EKS_SG --protocol tcp --port 0-65535 --source-group $EKS_SG --region $REGION
aws ec2 create-tags --resources $EKS_SG --tags Key=Name,Value=${PROJECT}-eks-sg --region $REGION
echo "EKS SG: $EKS_SG"

# RDS Security Group
RDS_SG=$(aws ec2 create-security-group \
  --group-name "${PROJECT}-rds-sg" --description "RDS - isolated tier, EKS only" \
  --vpc-id $VPC_ID --region $REGION --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --group-id $RDS_SG --protocol tcp --port 5432 --source-group $EKS_SG --region $REGION
aws ec2 create-tags --resources $RDS_SG --tags Key=Name,Value=${PROJECT}-rds-sg --region $REGION
echo "RDS SG: $RDS_SG"

echo ""
echo "========================================="
echo "Infrastructure created successfully!"
echo "========================================="
echo "VPC_ID=$VPC_ID"
echo "PUB_SUB_1=$PUB_SUB_1"
echo "PUB_SUB_2=$PUB_SUB_2"
echo "PRIV_EKS_SUB_1=$PRIV_EKS_SUB_1"
echo "PRIV_EKS_SUB_2=$PRIV_EKS_SUB_2"
echo "PRIV_DB_SUB_1=$PRIV_DB_SUB_1"
echo "PRIV_DB_SUB_2=$PRIV_DB_SUB_2"
echo "ALB_SG=$ALB_SG"
echo "EKS_SG=$EKS_SG"
echo "RDS_SG=$RDS_SG"
echo "NAT_GW=$NAT_GW"
echo "========================================="

# Save outputs for next steps
cat > table-order/infra/infra-outputs.env << EOF
VPC_ID=$VPC_ID
PUB_SUB_1=$PUB_SUB_1
PUB_SUB_2=$PUB_SUB_2
PRIV_EKS_SUB_1=$PRIV_EKS_SUB_1
PRIV_EKS_SUB_2=$PRIV_EKS_SUB_2
PRIV_DB_SUB_1=$PRIV_DB_SUB_1
PRIV_DB_SUB_2=$PRIV_DB_SUB_2
ALB_SG=$ALB_SG
EKS_SG=$EKS_SG
RDS_SG=$RDS_SG
NAT_GW=$NAT_GW
IGW_ID=$IGW_ID
REGION=$REGION
EOF

echo "Outputs saved to table-order/infra/infra-outputs.env"
