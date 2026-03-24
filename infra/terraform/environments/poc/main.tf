locals {
  name_prefix = "${var.project_name}-${var.environment}"

  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
    Owner       = var.owner
  }
}

module "network" {
  source = "../../modules/network"

  name_prefix     = local.name_prefix
  vpc_cidr        = var.vpc_cidr
  public_subnets  = var.public_subnet_cidrs
  private_subnets = var.private_subnet_cidrs
  tags            = local.common_tags
}

module "security_groups" {
  source = "../../modules/security-groups"

  name_prefix = local.name_prefix
  vpc_id      = module.network.vpc_id
  app_port    = var.app_port
  db_port     = var.db_port
  tags        = local.common_tags
}

module "iam_ecs" {
  source = "../../modules/iam-ecs"

  name_prefix                  = local.name_prefix
  s3_bucket_arns               = var.task_role_s3_bucket_arns
  secrets_manager_secret_arns  = var.task_role_secrets_manager_secret_arns
  tags                         = local.common_tags
}

module "ecr_repositories" {
  source = "../../modules/ecr-repositories"

  repository_names = var.ecr_repository_names
  tags             = local.common_tags
}

module "cloudwatch_logging" {
  source = "../../modules/cloudwatch-logging"

  log_group_names   = var.cloudwatch_log_group_names
  retention_in_days = var.cloudwatch_retention_in_days
  tags              = local.common_tags
}
