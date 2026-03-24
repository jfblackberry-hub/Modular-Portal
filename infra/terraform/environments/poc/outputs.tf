output "aws_region" {
  description = "AWS region for this environment."
  value       = var.aws_region
}

output "environment" {
  description = "Environment name."
  value       = var.environment
}

output "vpc_id" {
  description = "VPC ID."
  value       = module.network.vpc_id
}

output "public_subnet_ids" {
  description = "Public subnet IDs."
  value       = module.network.public_subnet_ids
}

output "private_subnet_ids" {
  description = "Private subnet IDs."
  value       = module.network.private_subnet_ids
}

output "alb_security_group_id" {
  description = "ALB security group ID."
  value       = module.security_groups.alb_security_group_id
}

output "ecs_security_group_id" {
  description = "ECS security group ID."
  value       = module.security_groups.ecs_security_group_id
}

output "rds_security_group_id" {
  description = "RDS security group ID."
  value       = module.security_groups.rds_security_group_id
}

output "ecs_task_execution_role_arn" {
  description = "ECS task execution role ARN."
  value       = module.iam_ecs.ecs_task_execution_role_arn
}

output "ecs_task_role_arn" {
  description = "ECS task role ARN."
  value       = module.iam_ecs.ecs_task_role_arn
}

output "ecr_repository_urls" {
  description = "ECR repository URLs keyed by service name."
  value       = module.ecr_repositories.repository_urls
}

output "cloudwatch_log_group_names" {
  description = "CloudWatch log group names."
  value       = module.cloudwatch_logging.log_group_names
}
