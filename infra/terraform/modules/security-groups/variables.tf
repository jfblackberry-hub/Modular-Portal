variable "name_prefix" {
  description = "Prefix used in resource names."
  type        = string
}

variable "vpc_id" {
  description = "VPC ID for the security groups."
  type        = string
}

variable "app_port" {
  description = "Application port exposed by ECS tasks."
  type        = number
  default     = 3000
}

variable "db_port" {
  description = "Database port exposed by RDS."
  type        = number
  default     = 5432
}

variable "tags" {
  description = "Common tags for all resources."
  type        = map(string)
  default     = {}
}
