variable "aws_region" {
  default = "ap-northeast-2"
}

variable "project_name" {
  default = "table-order"
}

variable "environment" {
  default = "prod"
}

variable "vpc_cidr" {
  default = "10.0.0.0/16"
}

variable "db_username" {
  default   = "tableorder"
  sensitive = true
}

variable "db_password" {
  sensitive = true
}

variable "eks_cluster_version" {
  default = "1.30"
}
