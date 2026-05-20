################################################################################
# ECR Repositories
################################################################################

locals {
  ecr_repositories = [
    "order-service",
    "admin-service",
    "frontend",
  ]
}

resource "aws_ecr_repository" "services" {
  for_each = toset(local.ecr_repositories)

  name                 = "${var.project_name}/${each.value}"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name        = "${var.project_name}-${each.value}"
    Environment = var.environment
    Project     = var.project_name
  }
}

################################################################################
# ECR Lifecycle Policy (Keep last 10 images)
################################################################################

resource "aws_ecr_lifecycle_policy" "services" {
  for_each = toset(local.ecr_repositories)

  repository = aws_ecr_repository.services[each.key].name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 10
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}
