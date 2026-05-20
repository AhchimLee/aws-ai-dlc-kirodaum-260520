#!/bin/bash
export AWS_PAGER=""
export PAGER="cat"
export GIT_PAGER="cat"

cd /home/ahchim/ai-dlc-260520

echo "=== Git Status ==="
git status --short | head -50

echo ""
echo "=== Adding table-order files ==="
git add table-order/

echo ""
echo "=== Committing ==="
git commit -m "feat: table-order service full implementation

- Backend: FastAPI Order Service + Admin Service
- Frontend: React + Vite + TypeScript
- Infrastructure: VPC 3-tier, EKS 1.35 Auto-mode, Security Groups
- K8s manifests: Deployments, HPA, Ingress, Observability
- CI/CD: GitHub Actions pipeline
- Docs: Architecture manual, QA test manual, deployment history
- AI-DLC: aidlc-docs with audit, ADR, workflow state" 2>&1

echo ""
echo "=== Pushing ==="
git push 2>&1 || git push --set-upstream origin main 2>&1 || git push --set-upstream origin master 2>&1

echo ""
echo "=== Done ==="
