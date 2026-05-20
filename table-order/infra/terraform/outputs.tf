################################################################################
# Outputs
################################################################################

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "cluster_endpoint" {
  description = "EKS cluster API endpoint"
  value       = module.eks.cluster_endpoint
}

output "cluster_certificate_authority" {
  description = "EKS cluster CA certificate"
  value       = module.eks.cluster_certificate_authority_data
  sensitive   = true
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "rds_database_name" {
  description = "RDS database name"
  value       = aws_db_instance.main.db_name
}

output "ecr_repository_urls" {
  description = "ECR repository URLs"
  value = {
    for name, repo in aws_ecr_repository.services : name => repo.repository_url
  }
}

output "cicd_role_arn" {
  description = "CI/CD IAM role ARN for GitHub Actions"
  value       = aws_iam_role.cicd.arn
}

output "order_service_role_arn" {
  description = "Order service IRSA role ARN"
  value       = aws_iam_role.order_service.arn
}

output "admin_service_role_arn" {
  description = "Admin service IRSA role ARN"
  value       = aws_iam_role.admin_service.arn
}
