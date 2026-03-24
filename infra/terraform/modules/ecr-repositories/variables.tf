variable "repository_names" {
  description = "Names of ECR repositories to create."
  type        = list(string)
}

variable "image_tag_mutability" {
  description = "Whether image tags can be overwritten."
  type        = string
  default     = "MUTABLE"
}

variable "force_delete" {
  description = "Delete repositories even if they still contain images."
  type        = bool
  default     = false
}

variable "tags" {
  description = "Common tags for all resources."
  type        = map(string)
  default     = {}
}
