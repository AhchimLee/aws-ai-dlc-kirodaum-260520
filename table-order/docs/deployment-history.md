# Deployment History

## Version Log

| Version | Date | Commit | Services | Status | Notes |
|---------|------|--------|----------|--------|-------|
| v1.0.0 | 2026-05-20 | initial | order-service, admin-service, frontend | ✅ Deployed | Initial release - all 14 requirements implemented |

## Deployment Procedure

1. Push to `main` branch triggers GitHub Actions
2. Docker images built and pushed to ECR
3. K8s manifests updated with new image tags
4. Rolling update applied to EKS cluster
5. Smoke tests verify health endpoints
6. Rollback on failure: `kubectl rollout undo deployment/<service> -n table-order`

## Infrastructure Changes

| Date | Change | Terraform Apply | Status |
|------|--------|-----------------|--------|
| 2026-05-20 | Initial VPC + EKS + RDS setup | ✅ | Complete |

## Rollback Procedure

```bash
# Rollback specific service
kubectl rollout undo deployment/order-service -n table-order

# Rollback to specific revision
kubectl rollout undo deployment/order-service -n table-order --to-revision=2

# Check rollout history
kubectl rollout history deployment/order-service -n table-order
```

## Monitoring Checklist (Post-Deploy)

- [ ] All pods Running (kubectl get pods -n table-order)
- [ ] Health endpoints responding (healthz, readyz)
- [ ] ALB target groups healthy
- [ ] No error logs in CloudWatch
- [ ] SSE connections working
- [ ] Order creation flow working end-to-end
