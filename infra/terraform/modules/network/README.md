# Network Module

Creates a lightweight but production-shaped VPC foundation:

- 1 VPC
- 2 public subnets across 2 AZs
- 2 private subnets across 2 AZs
- 1 Internet Gateway
- 1 single-AZ NAT Gateway for cost control

Inputs:

- `name_prefix`
- `vpc_cidr`
- `public_subnets`
- `private_subnets`
- `availability_zone_count`
- `tags`

Outputs:

- `vpc_id`
- `public_subnet_ids`
- `private_subnet_ids`
- `internet_gateway_id`
- `nat_gateway_id`
