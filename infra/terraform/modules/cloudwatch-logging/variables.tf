variable "log_group_names" {
  description = "CloudWatch log group names to create."
  type        = list(string)
}

variable "retention_in_days" {
  description = "Retention for CloudWatch log groups."
  type        = number
  default     = 30
}

variable "tags" {
  description = "Common tags for all resources."
  type        = map(string)
  default     = {}
}
