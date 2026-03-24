output "log_group_names" {
  description = "CloudWatch log group names."
  value       = [for group in aws_cloudwatch_log_group.this : group.name]
}

output "log_group_arns" {
  description = "CloudWatch log group ARNs keyed by name."
  value       = { for name, group in aws_cloudwatch_log_group.this : name => group.arn }
}
