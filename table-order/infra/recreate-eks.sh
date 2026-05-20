#!/bin/bash
set -e
export AWS_PAGER=""
REGION="us-east-1"
CLUSTER="table-order-cluster"

echo "=== Deleting existing EKS cluster ==="
eksctl delete cluster --name $CLUSTER --region $REGION --wait 2>&1 || true
echo "=== Old cluster deleted ==="

echo ""
echo "=== Creating EKS 1.35 with Auto-mode + EKS API access ==="

# Use existing VPC subnets
cat > /tmp/eks-config.yaml << 'EOF'
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig

metadata:
  name: table-order-cluster
  region: us-east-1
  version: "1.35"

accessConfig:
  authenticationMode: API

vpc:
  id: vpc-009237b5a51a99c74
  subnets:
    public:
      us-east-1a:
        id: subnet-047b9d9f5158881db
      us-east-1b:
        id: subnet-06a21ecb6befdf002
    private:
      us-east-1a:
        id: subnet-0cccc44fa189544cb
      us-east-1b:
        id: subnet-0d870aa5053a72bb6

autoModeConfig:
  enabled: true

iam:
  withOIDC: true

addons:
  - name: vpc-cni
    version: latest
  - name: coredns
    version: latest
  - name: kube-proxy
    version: latest

cloudWatch:
  clusterLogging:
    enableTypes:
      - api
      - audit
      - authenticator
      - controllerManager
      - scheduler
EOF

eksctl create cluster -f /tmp/eks-config.yaml 2>&1

echo ""
echo "========================================="
echo "EKS 1.35 Auto-mode cluster created!"
echo "========================================="
kubectl get nodes
