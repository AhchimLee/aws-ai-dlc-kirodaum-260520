#!/bin/bash
set -e
export AWS_PAGER=""
REGION="us-east-1"
CLUSTER="table-order-cluster"
VPC_ID="vpc-009237b5a51a99c74"
PRIV_EKS_SUB_1="subnet-0cccc44fa189544cb"
PRIV_EKS_SUB_2="subnet-0d870aa5053a72bb6"
PUB_SUB_1="subnet-047b9d9f5158881db"
PUB_SUB_2="subnet-06a21ecb6befdf002"
EKS_SG="sg-0b7084931e28c9aa5"

echo "=== Creating EKS Cluster Role ==="
cat > /tmp/eks-trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "eks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create role (ignore if exists)
aws iam create-role \
  --role-name table-order-eks-cluster-role \
  --assume-role-policy-document file:///tmp/eks-trust-policy.json \
  --region $REGION 2>/dev/null || echo "Role already exists"

aws iam attach-role-policy \
  --role-name table-order-eks-cluster-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonEKSClusterPolicy \
  --region $REGION 2>/dev/null || true

aws iam attach-role-policy \
  --role-name table-order-eks-cluster-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonEKSComputePolicy \
  --region $REGION 2>/dev/null || true

aws iam attach-role-policy \
  --role-name table-order-eks-cluster-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonEKSBlockStoragePolicy \
  --region $REGION 2>/dev/null || true

aws iam attach-role-policy \
  --role-name table-order-eks-cluster-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonEKSLoadBalancingPolicy \
  --region $REGION 2>/dev/null || true

aws iam attach-role-policy \
  --role-name table-order-eks-cluster-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonEKSNetworkingPolicy \
  --region $REGION 2>/dev/null || true

ROLE_ARN=$(aws iam get-role --role-name table-order-eks-cluster-role --query Role.Arn --output text --region $REGION)
echo "Cluster Role ARN: $ROLE_ARN"

echo ""
echo "=== Creating EKS 1.35 Cluster with Auto-mode + API access ==="
aws eks create-cluster \
  --name $CLUSTER \
  --region $REGION \
  --kubernetes-version "1.35" \
  --role-arn "$ROLE_ARN" \
  --resources-vpc-config "subnetIds=$PRIV_EKS_SUB_1,$PRIV_EKS_SUB_2,$PUB_SUB_1,$PUB_SUB_2,securityGroupIds=$EKS_SG,endpointPublicAccess=true,endpointPrivateAccess=true" \
  --access-config "authenticationMode=API" \
  --compute-config "enabled=true,nodePools=general-purpose,nodeRoleArn=$ROLE_ARN" \
  --kubernetes-network-config "elasticLoadBalancing={enabled=true}" \
  --storage-config "blockStorage={enabled=true}" \
  --no-cli-pager

echo ""
echo "=== Waiting for cluster to become ACTIVE ==="
aws eks wait cluster-active --name $CLUSTER --region $REGION
echo "Cluster is ACTIVE!"

echo ""
echo "=== Updating kubeconfig ==="
aws eks update-kubeconfig --name $CLUSTER --region $REGION --no-cli-pager

echo ""
echo "=== Cluster info ==="
kubectl get nodes 2>/dev/null || echo "(No nodes yet - Auto-mode will provision on demand)"
kubectl cluster-info

echo ""
echo "========================================="
echo "EKS 1.35 Auto-mode cluster ready!"
echo "========================================="
