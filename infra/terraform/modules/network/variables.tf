variable "name_prefix" {
  description = "Prefix used in resource names."
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC."
  type        = string
}

variable "public_subnets" {
  description = "Two public subnet CIDR blocks."
  type        = list(string)

  validation {
    condition     = length(var.public_subnets) == var.availability_zone_count
    error_message = "public_subnets must match availability_zone_count."
  }
}

variable "private_subnets" {
  description = "Two private subnet CIDR blocks."
  type        = list(string)

  validation {
    condition     = length(var.private_subnets) == var.availability_zone_count
    error_message = "private_subnets must match availability_zone_count."
  }
}

variable "availability_zone_count" {
  description = "How many availability zones to use."
  type        = number
  default     = 2

  validation {
    condition     = var.availability_zone_count >= 2
    error_message = "availability_zone_count must be at least 2."
  }
}

variable "tags" {
  description = "Common tags for all resources."
  type        = map(string)
  default     = {}
}
