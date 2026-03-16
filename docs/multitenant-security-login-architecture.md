# Multitenant Security and Login Redesign

## Why this redesign is needed

Current behavior allows cross-population risk because identity and tenant context are not fully server-trusted:

- API identity is derived from `x-user-id` header (`apps/api/src/services/current-user-service.ts`).
- Member routes can resolve arbitrary users by header and fall back to a default user (`apps/api/src/routes/member.ts`).
- Portal session state is stored in client-readable cookies/localStorage (`apps/portal-web/app/login/login-form.tsx`, `apps/portal-web/lib/portal-session.ts`).
- Middleware authorization is based on a client-controlled cookie payload (`apps/portal-web/middleware.ts`).

This makes tenant isolation and branding isolation inconsistent in practice.

## Target architecture (clean, consistent, tenant-safe)

### 1. Identity and session model

- Use short-lived access tokens (JWT, 5-15 min) and rotating refresh tokens (7-30 days).
- Store refresh token in `HttpOnly`, `Secure`, `SameSite=Lax` cookie.
- Keep access token server-side in a signed session cookie or server session store.
- Do not store auth identity in localStorage.
- Do not trust client-submitted `tenantId`, `userId`, roles, or permissions.

### 2. Trust boundaries

- Browser -> Portal web app:
  - Browser sends cookies only.
  - Portal web does not accept user identity from query params/headers.
- Portal web -> API:
  - Forward server-issued bearer token only.
  - Never forward `x-user-id`.
- API:
  - Verify JWT signature, issuer, audience, expiry.
  - Resolve user + tenant from token claims (`sub`, `tenant_id`, `roles`, `permissions`).
  - Enforce tenant scope in every query.

### 3. Tenant isolation model

- Every tenant-scoped table query must include `tenantId` guard.
- Add a shared data-access helper that requires `{ tenantId }` and disallows unscoped calls.
- Optional hardening: Postgres Row-Level Security (RLS) with `current_setting('app.tenant_id')`.
- Platform-admin routes use explicit cross-tenant scope grants and full audit logs.

### 4. Branding isolation model

- Separate branding domains:
  - `payerBranding` (member/provider primary branding)
  - `employerBranding` (employer portal branding/context)
- Member portal must always render payer-primary branding.
- Employer/group appears as contextual metadata only in member portal.
- Branding resolver accepts `(portalExperience, tenantContext)` and returns immutable view model.

### 5. Authorization model

- Route-level policy checks on API handlers (`requireRole`, `requirePermission`, `requireTenantScope`).
- UI module visibility is advisory only; API remains source of truth.
- Middleware should validate a signed server session, not client JSON role payload.

### 6. Observability and forensics

- Structured auth logs:
  - login attempt/success/failure
  - token refresh/revocation
  - tenant mismatch denial
  - authorization denial
- Correlate with request ID and user/tenant IDs.
- Alert on:
  - repeated tenant mismatch attempts
  - sudden cross-tenant access denials
  - anomalous refresh token reuse.

## Reference request flow

1. User submits credentials.
2. Auth service validates credentials and tenant context.
3. Auth service issues:
   - Access token (short-lived)
   - Refresh token (rotation, server-tracked family/jti)
4. Portal stores refresh cookie (`HttpOnly`, `Secure`) and signed server session.
5. Portal calls API with access token.
6. API verifies token, derives tenant context, enforces policy, returns tenant-scoped data.
7. Refresh endpoint rotates refresh token and invalidates prior token.
8. Logout revokes refresh token family and clears server session.

## Migration plan

### Phase 0: Immediate containment (1-2 days)

- Remove member route fallback user behavior.
- Reject requests without verified auth context.
- Stop using `x-user-id` as identity in production mode.
- Add tenant-scope assertion helper used by all member/employer/provider endpoints.
- Add auth/tenant mismatch logs.

### Phase 1: Session hardening (3-5 days)

- Introduce signed server session cookie and remove localStorage identity usage.
- Move login flow to server-controlled session establishment.
- Update middleware to validate signed session only.

### Phase 2: API auth unification (4-7 days)

- Introduce JWT verification middleware in API.
- Replace `getCurrentUserFromHeaders` with token claims + DB lookup.
- Remove `x-user-id` path after transition window.

### Phase 3: Branding/data contract cleanup (3-5 days)

- Split payer vs employer branding schema.
- Make portal experience branding resolver mandatory.
- Add tests for member payer-first branding and tenant isolation.

### Phase 4: Defense-in-depth (optional)

- Add Postgres RLS for tenant-scoped tables.
- Add refresh token replay detection and forced logout on replay.
- Add security regression suite in CI.

## Required regression tests

- AuthN:
  - valid login sets server session
  - invalid token rejected
  - refresh rotation works, old refresh rejected
- AuthZ:
  - member cannot access employer/admin endpoints
  - tenant A user cannot read tenant B data
- Branding:
  - member portal always payer-primary
  - employer shown only as contextual metadata
- Session:
  - no user identity in localStorage
  - middleware denies tampered client cookies.

## Implementation standards

- All tenant-scoped service methods must take `tenantId` as required argument.
- No raw Prisma calls in routes; use scoped service layer only.
- No route should choose user by request header except verified token middleware.
- All privileged actions emit audit events with actor + tenant + entity metadata.

## Recommended first engineering slice

Implement Phase 0 first and treat it as a release gate before additional UI changes:

1. Eliminate default-user fallback in member routes.
2. Enforce verified auth context on all portal APIs.
3. Add a shared `assertTenantMatch` helper and apply across endpoints.
4. Add deny logs with request/user/tenant correlation.

