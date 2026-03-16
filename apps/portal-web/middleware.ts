import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { hasBillingEnrollmentRoleAccess } from './lib/billing-enrollment-access';
import { isTenantModuleEnabled, type TenantPortalModuleId } from './lib/tenant-modules';

type PortalUserCookie = {
  roles?: string[];
  permissions?: string[];
  tenant?: {
    brandingConfig?: Record<string, unknown>;
  };
};

const routeModuleMap: Array<{ prefix: string; moduleId: TenantPortalModuleId; fallback: string }> = [
  { prefix: '/provider/admin', moduleId: 'provider_admin', fallback: '/provider/dashboard' },
  { prefix: '/provider/support', moduleId: 'provider_support', fallback: '/provider/dashboard' },
  { prefix: '/provider/messages', moduleId: 'provider_messages', fallback: '/provider/dashboard' },
  { prefix: '/provider/documents', moduleId: 'provider_documents', fallback: '/provider/dashboard' },
  { prefix: '/provider/patients', moduleId: 'provider_patients', fallback: '/provider/dashboard' },
  { prefix: '/provider/payments', moduleId: 'provider_payments', fallback: '/provider/dashboard' },
  { prefix: '/provider/claims', moduleId: 'provider_claims', fallback: '/provider/dashboard' },
  { prefix: '/provider/authorizations', moduleId: 'provider_authorizations', fallback: '/provider/dashboard' },
  { prefix: '/provider/eligibility', moduleId: 'provider_eligibility', fallback: '/provider/dashboard' },
  { prefix: '/provider/dashboard', moduleId: 'provider_dashboard', fallback: '/login' },
  { prefix: '/member/documents', moduleId: 'member_documents', fallback: '/member' },
  { prefix: '/member/claims', moduleId: 'member_claims', fallback: '/member' },
  { prefix: '/member', moduleId: 'member_home', fallback: '/login' },
  { prefix: '/dashboard/billing-enrollment', moduleId: 'billing_enrollment', fallback: '/dashboard' },
  { prefix: '/dashboard/help', moduleId: 'member_support', fallback: '/dashboard' },
  { prefix: '/dashboard/billing', moduleId: 'member_billing', fallback: '/dashboard' },
  { prefix: '/dashboard/documents', moduleId: 'member_documents', fallback: '/dashboard' },
  { prefix: '/dashboard/messages', moduleId: 'member_messages', fallback: '/dashboard' },
  { prefix: '/dashboard/authorizations', moduleId: 'member_authorizations', fallback: '/dashboard' },
  { prefix: '/dashboard/providers', moduleId: 'member_providers', fallback: '/dashboard' },
  { prefix: '/dashboard/id-card', moduleId: 'member_id_card', fallback: '/dashboard' },
  { prefix: '/dashboard/claims', moduleId: 'member_claims', fallback: '/dashboard' },
  { prefix: '/dashboard/benefits', moduleId: 'member_benefits', fallback: '/dashboard' },
  { prefix: '/dashboard', moduleId: 'member_home', fallback: '/login' }
];

function parsePortalUserCookie(raw: string | undefined) {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(decodeURIComponent(raw)) as PortalUserCookie;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const route = routeModuleMap.find((item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`));

  if (!route) {
    return NextResponse.next();
  }

  const portalUser = parsePortalUserCookie(request.cookies.get('portal-user')?.value);
  const brandingConfig = portalUser?.tenant?.brandingConfig;

  if (
    (pathname === '/dashboard/billing-enrollment' ||
      pathname.startsWith('/dashboard/billing-enrollment/')) &&
    !hasBillingEnrollmentRoleAccess({
      roles: portalUser?.roles ?? [],
      pathname
    })
  ) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = route.fallback;
    redirectUrl.search = '';
    return NextResponse.redirect(redirectUrl);
  }

  if (isTenantModuleEnabled(brandingConfig, route.moduleId)) {
    return NextResponse.next();
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = route.fallback;
  redirectUrl.search = '';
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ['/provider', '/provider/:path*', '/dashboard', '/dashboard/:path*', '/member', '/member/:path*']
};
