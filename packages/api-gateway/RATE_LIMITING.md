# API Gateway rate limiting

## Behavior

- **Algorithm:** fixed window per key (`count` + `resetAt`).
- **Key:** `HTTP method` + `route pattern (or pathname without query)` + `fingerprint(authenticated user id or IP)`.
- **Storage:** bounded in-process `Map` with **LRU eviction** when `API_GATEWAY_RATE_LIMIT_MAX_TRACKED_KEYS` is reached. Expired windows are removed on access and during eviction.
- **Scope:** **instance-local.** Each replica maintains its own counters. Total allowed traffic scales roughly with replica count unless a shared store is added.

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `API_GATEWAY_RATE_LIMIT_MAX` | `100` | Max requests per window per key. Set to `0` to disable rate limiting. Invalid values fall back to default. |
| `API_GATEWAY_RATE_LIMIT_WINDOW_MS` | `60000` | Window length in milliseconds. Set to `0` to disable. |
| `API_GATEWAY_RATE_LIMIT_MAX_TRACKED_KEYS` | `50000` | Maximum distinct buckets. Protects against cardinality / memory exhaustion; oldest or expired entries are evicted. |

## Operational notes

- Identity uses a **short hash** of user id or IP so map keys stay fixed-size and do not retain raw high-cardinality strings beyond the cap.
- Under eviction, some clients may get a **fresh window** sooner than strictly fair; this is intentional tradeoff for hard memory bounds.
- **Follow-up for production hardening:** optional Redis-backed limiter (same key shape) for **distributed** limits and optional **sliding** window semantics.
