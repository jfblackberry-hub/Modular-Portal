import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import {
  getPortalSessionCookieName,
  readPortalSessionEnvelopeFromCookie
} from './lib/portal-session-cookie';
import { hasBillingEnrollmentRoleAccess } from './lib/billing-enrollment-access';
import {
  hasBillingPortalAudienceAccess,
  mapLegacyBillingPortalPath,
  resolveBillingPortalAudience
} from './lib/billing-portal-audience';
import { isTenantModuleEnabled, type TenantPortalModuleId } from './lib/tenant-modules';

type PortalUserCookie = {
  roles?: string[];
  permissions?: string[];
  landingContext?: string;
  session?: {
    type?: 'tenant_admin' | 'end_user' | 'platform_admin';
    tenantId?: string | null;
    roles?: string[];
    permissions?: string[];
  };
  tenant?: {
    id?: string;
    brandingConfig?: Record<string, unknown>;
  };
  previewSession?: {
    id?: string;
  };
};

const routeModuleMap: Array<{ prefix: string; moduleId: TenantPortalModuleId; fallback: string }> = [
  { prefix: '/employer', moduleId: 'billing_enrollment', fallback: '/dashboard' },
  { prefix: '/broker', moduleId: 'billing_enrollment', fallback: '/dashboard' },
  { prefix: '/individual', moduleId: 'billing_enrollment', fallback: '/dashboard' },
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
  { prefix: '/dashboard/care-cost-estimator', moduleId: 'member_care_cost_estimator', fallback: '/dashboard' },
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

function toLoginRedirect(request: NextRequest) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = '/login';
  redirectUrl.search = '';
  return NextResponse.redirect(redirectUrl);
}

function toFallbackRedirect(request: NextRequest, pathname: string) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = pathname;
  redirectUrl.search = '';
  return NextResponse.redirect(redirectUrl);
}

function hasTenantAdminAccess(portalUser: PortalUserCookie | null) {
  if (!portalUser) {
    return false;
  }

  const roleSet = new Set(portalUser.roles ?? []);
  const sessionType = portalUser.session?.type;
  const tenantId = portalUser.session?.tenantId;

  if (!tenantId || sessionType !== 'tenant_admin') {
    return false;
  }

  return roleSet.has('tenant_admin') ||
    roleSet.has('TENANT_ADMIN') ||
    roleSet.has('tenant_operator') ||
    roleSet.has('TENANT_OPERATOR');
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (pathname === '/tenant-admin' || pathname.startsWith('/tenant-admin/')) {
    const portalSession = await readPortalSessionEnvelopeFromCookie(
      request.cookies.get(getPortalSessionCookieName())?.value
    );
    const portalUser = portalSession?.user as PortalUserCookie | null;

    if (!portalUser || !portalSession?.accessToken) {
      return toLoginRedirect(request);
    }

    if (!hasTenantAdminAccess(portalUser)) {
      return toFallbackRedirect(request, '/dashboard');
    }

    return NextResponse.next();
  }

  const route = routeModuleMap.find((item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`));

  if (!route) {
    return NextResponse.next();
  }

  const portalSession = await readPortalSessionEnvelopeFromCookie(
    request.cookies.get(getPortalSessionCookieName())?.value
  );
  const portalUser = portalSession?.user as PortalUserCookie | null;

  if (!portalUser || !portalSession?.accessToken) {
    return toLoginRedirect(request);
  }

  if (
    portalUser.previewSession?.id &&
    portalUser.session?.type !== 'end_user'
  ) {
    return toLoginRedirect(request);
  }

  const brandingConfig = portalUser?.tenant?.brandingConfig;

  if (pathname === '/employer' || pathname.startsWith('/employer/')) {
    if (!hasBillingPortalAudienceAccess(portalUser?.roles ?? [], 'employer')) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = route.fallback;
      redirectUrl.search = '';
      return NextResponse.redirect(redirectUrl);
    }
  }

  if (pathname === '/individual' || pathname.startsWith('/individual/')) {
    if (!hasBillingPortalAudienceAccess(portalUser?.roles ?? [], 'individual')) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = route.fallback;
      redirectUrl.search = '';
      return NextResponse.redirect(redirectUrl);
    }
  }

  if (pathname === '/broker' || pathname.startsWith('/broker/')) {
    if (!hasBillingPortalAudienceAccess(portalUser?.roles ?? [], 'broker')) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = route.fallback;
      redirectUrl.search = '';
      return NextResponse.redirect(redirectUrl);
    }
  }

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

  if (
    pathname === '/dashboard/billing-enrollment' ||
    pathname.startsWith('/dashboard/billing-enrollment/')
  ) {
    const audience = resolveBillingPortalAudience({
      roles: portalUser?.roles ?? [],
      landingContext:
        portalUser?.landingContext === 'employer'
          ? 'employer'
          : portalUser?.landingContext === 'broker'
            ? 'broker'
            : undefined
    });
    const mappedPath = mapLegacyBillingPortalPath(pathname, audience);

    if (mappedPath && mappedPath !== pathname) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = mappedPath;
      redirectUrl.search = '';
      return NextResponse.redirect(redirectUrl);
    }
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
  matcher: [
    '/provider',
    '/provider/:path*',
    '/dashboard',
    '/dashboard/:path*',
    '/member',
    '/member/:path*',
    '/employer',
    '/employer/:path*',
    '/broker',
    '/broker/:path*',
    '/individual',
    '/individual/:path*',
    '/tenant-admin',
    '/tenant-admin/:path*'
  ]
};
