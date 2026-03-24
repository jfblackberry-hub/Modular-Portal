variable "aws_region" {
  description = "AWS region for the POC environment."
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
  default     = "poc"
}

variable "project_name" {
  description = "Project name used in tags and resource naming."
  type        = string
  default     = "modular-portal"
}

variable "owner" {
  description = "Owning team or person."
  type        = string
  default     = "platform"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC."
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for the public subnets."
  type        = list(string)
  default     = ["10.0.0.0/24", "10.0.1.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for the private subnets."
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

variable "app_port" {
  description = "Application port for ECS services behind the ALB."
  type        = number
  default     = 3000
}

variable "db_port" {
  description = "Database port for the RDS engine."
  type        = number
  default     = 5432
}

variable "ecr_repository_names" {
  description = "Container repositories for the portal workloads."
  type        = list(string)
  default     = ["portal-web", "admin-console", "api-server"]
}

variable "cloudwatch_log_group_names" {
  description = "CloudWatch log groups for the portal workloads."
  type        = list(string)
  default = [
    "/aws/ecs/poc/portal-web",
    "/aws/ecs/poc/admin-console",
    "/aws/ecs/poc/api-server"
  ]
}

variable "cloudwatch_retention_in_days" {
  description = "Log retention period."
  type        = number
  default     = 30
}

variable "task_role_s3_bucket_arns" {
  description = "S3 buckets the ECS task role may access."
  type        = list(string)
}

variable "task_role_secrets_manager_secret_arns" {
  description = "Secrets Manager secrets the ECS task role may read."
  type        = list(string)
}
