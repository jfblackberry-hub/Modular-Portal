# Security Groups Module

Creates the minimum security group chain for the portal stack:

- ALB security group allows `80` and `443` from the internet
- ECS security group allows only application traffic from the ALB security group
- RDS security group allows only database traffic from the ECS security group
