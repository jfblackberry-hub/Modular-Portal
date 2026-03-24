variable "name_prefix" {
  description = "Prefix used in IAM role names."
  type        = string
}

variable "s3_bucket_arns" {
  description = "S3 bucket ARNs the ECS task role may access."
  type        = list(string)
}

variable "secrets_manager_secret_arns" {
  description = "Secrets Manager secret ARNs the ECS task role may read."
  type        = list(string)
}

variable "tags" {
  description = "Common tags for all resources."
  type        = map(string)
  default     = {}
}
