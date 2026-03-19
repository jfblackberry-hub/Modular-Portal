# E&B Audience Split Architecture

## Summary

The Enrollment & Billing experience now separates into two audience-specific portal spaces while preserving the current visual system, shell, card styling, table styling, form styling, spacing, and overall page composition patterns:

- `/employer`
- `/individual`

The implementation is structural rather than cosmetic. Existing employer and consumer-facing components are reused behind new audience-aware routing, navigation, and access control helpers.

## What Remains Shared

- The existing portal shell, header, footer, side navigation styling, cards, tables, forms, and typography
- Shared Billing & Enrollment components such as `EnrollmentExperience`, `BillingExperience`, `SupportingExperiences`, and the dashboard presentation patterns
- Shared API/service layer in [`apps/portal-web/lib/billing-enrollment-api.ts`](/Users/jfrank/Projects/Modular%20portal/apps/portal-web/lib/billing-enrollment-api.ts)
- Shared tenant branding and theme resolution
- Shared module gating through `billing_enrollment`

## What Is Split

- Audience route spaces:
  - `/employer`
  - `/individual`
- Audience navigation definitions
- Audience role/access checks
- Legacy `/dashboard/billing-enrollment*` redirect behavior
- Audience terminology and information architecture

## How Audience Routing Works

- Audience resolution is centralized in [`apps/portal-web/lib/billing-portal-audience.ts`](/Users/jfrank/Projects/Modular%20portal/apps/portal-web/lib/billing-portal-audience.ts).
- Employer roles resolve to the employer portal.
- Member roles resolve to the individual portal.
- Legacy `/dashboard/billing-enrollment*` URLs are redirected to the appropriate audience route by middleware.
- New dedicated layouts at [`apps/portal-web/app/employer/layout.tsx`](/Users/jfrank/Projects/Modular%20portal/apps/portal-web/app/employer/layout.tsx) and [`apps/portal-web/app/individual/layout.tsx`](/Users/jfrank/Projects/Modular%20portal/apps/portal-web/app/individual/layout.tsx) reuse the current portal shell and branding while loading audience-specific navigation.

## How Labels And Content Differ

- Employer routes use employer/group/member administration language.
- Individual routes use consumer/household/application language.
- Existing shared components stay visually unchanged; the split is driven by route choice and page composition rather than by a new theme.

## Audit Matrix

| Area | Current Asset | Classification | Notes / Audience Treatment |
| --- | --- | --- | --- |
| Dashboard | `/dashboard/billing-enrollment` | Mixed and must be split | Now redirects to `/employer` or `/individual` |
| Employer dashboard | `EmployerCommandCenterDashboard` | Employer only | Reused as `/employer` home |
| Consumer dashboard | `BillingEnrollmentDashboard` | Individual only | Reused as `/individual` home |
| Plan shopping | `EnrollmentExperience` `shop-plans`, `compare-plans` | Individual only | Mounted under `/individual/shop-plans` |
| Enrollment stepper | `EnrollmentExperience` `start-enrollment`, `status-tracker`, `renew-coverage`, `report-life-event`, `manage-household`, `verify-eligibility`, `upload-documents` | Individual only | Consumer application journey; no employer routing |
| Dependents management | `DependentsExperience` | Individual only | Routed to `/individual/household` |
| Consumer billing | `BillingExperience` | Individual only | Routed to `/individual/billing-payments` |
| Consumer documents | `DocumentsExperience` | Individual only | Routed to `/individual/documents` |
| Support center | `SupportExperience` | Shared but needs audience-specific labels/content | Reused in both portals for now; future copy hardening recommended |
| Notices center | `NoticesExperience` | Shared but needs audience-specific labels/content | Currently consumer leaning; future audience copy split recommended |
| Employee roster | `/dashboard/billing-enrollment/employees` and `EmployeeCensusList` | Employer only | Routed to `/employer/employees` |
| Employee detail | `/dashboard/billing-enrollment/employees/[employeeId]` | Employer only | Keeps covered dependent admin only in employee context |
| Enrollment activity | `/dashboard/billing-enrollment/enrollment-activity` | Employer only | Routed as `/employer/eligibility-changes` |
| Open enrollment | `/dashboard/billing-enrollment/open-enrollment` | Employer only | Routed as `/employer/enrollment` |
| Census import | `/dashboard/billing-enrollment/census-import` | Employer only | Remains employer-only and should stay off individual nav |
| Employer tasks | `/dashboard/billing-enrollment/tasks` | Employer only | Not in top nav now; legacy links redirect to employer home |
| Employer notifications | `/dashboard/billing-enrollment/notifications` | Employer only | Not in top nav now; legacy links redirect to employer home |
| Employer administration | `/dashboard/billing-enrollment/administration` | Employer only | Routed to `/employer/admin` |
| Employer billing overview | `/dashboard/billing-enrollment/billing-overview` | Employer only | Routed to `/employer/billing` |
| Employer document center | `/dashboard/billing-enrollment/document-center` | Employer only | Routed to `/employer/documents` |
| Reports | `/dashboard/billing-enrollment/reports` | Employer only | Routed to `/employer/reports` |
| Household language inside employer flows | employee detail, open enrollment, activity datasets | Shared but needs audience-specific labels/content | Dependents stay only where tied to employee coverage administration |
| Generic workspace component | `BillingEnrollmentWorkspace` | Mixed | Candidate for future cleanup or retirement in favor of audience-specific shells |

## Initial Route Mapping

### Employer

- `/employer`
- `/employer/employees`
- `/employer/employees/[employeeId]`
- `/employer/enrollment`
- `/employer/eligibility-changes`
- `/employer/billing`
- `/employer/documents`
- `/employer/documents/view/[documentId]`
- `/employer/reports`
- `/employer/reports/analytics`
- `/employer/reports/schedule`
- `/employer/support`
- `/employer/admin`

### Individual

- `/individual`
- `/individual/shop-plans`
- `/individual/shop-plans/compare`
- `/individual/my-application`
- `/individual/my-coverage`
- `/individual/household`
- `/individual/billing-payments`
- `/individual/billing-payments/next-invoice`
- `/individual/billing-payments/invoice/[invoiceId]`
- `/individual/billing-payments/history`
- `/individual/billing-payments/make`
- `/individual/billing-payments/methods`
- `/individual/billing-payments/autopay`
- `/individual/billing-payments/statements`
- `/individual/documents`
- `/individual/documents/upload`
- `/individual/support`
- `/individual/profile`

## Demo Personas

### Employer portal

- `EMP-0316043829906172-001`
  - Employer admin persona
  - Best for employee roster, billing, reports, and document center demos
- `EMP-0316043829906172-002`
  - Second employer account
  - Best for validating tenant-specific employer data separation
- `broker`
  - Broker/support-style employer workflow access
- `ops`
  - Internal operations persona for employer-support scenarios

### Individual portal

- `maria`
  - Baseline individual/member persona
  - Best for household, billing, documents, and coverage demos
- `m0000002`
  - SQL-backed member persona
- `realmember`
  - Alternate demo member persona

## QA Checklist

- Verify `/dashboard/billing-enrollment` redirects employer roles to `/employer`.
- Verify `/dashboard/billing-enrollment` redirects member roles to `/individual`.
- Verify employer roles cannot access `/individual`.
- Verify member roles cannot access `/employer`.
- Verify `/employer` navigation contains only employer-relevant items.
- Verify `/individual` navigation contains only consumer-relevant items.
- Verify employer pages do not show shopper-first labels such as “Shop Plans” or “Household shopping.”
- Verify individual pages do not show employer-first labels such as “Census Imports” or “Employer Administration.”
- Verify employee detail pages keep dependent information only as covered dependent administration.
- Verify branding, shell, card styling, table styling, and spacing remain visually unchanged.
- Verify legacy deep links for mapped billing/enrollment pages redirect into the correct audience route.
- Verify provider, member dashboard, and admin console flows remain unaffected outside the E&B split.

## Follow-Up Hardening

- Split shared support/notices copy into audience-specific dictionaries where copy still feels generic.
- Add automated route tests for audience redirects and access boundaries.
- Add explicit individual login entry point if the business wants direct sign-in into `/individual`.
