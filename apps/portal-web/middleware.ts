import './lib/runtime-config';

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { hasBillingEnrollmentRoleAccess } from './lib/billing-enrollment-access';
import {
  hasBillingPortalAudienceAccess,
  mapLegacyBillingPortalPath,
  resolveBillingPortalAudience
} from './lib/billing-portal-audience';
import { DEMO_ACCESS_COOKIE, findDemoUser } from './lib/demo-access';
import {
  getPortalSessionCookieNames,
  readPortalSessionEnvelopeFromCookie
} from './lib/portal-session-cookie';
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
  { prefix: '/provider/admin', moduleId: 'provider_operations', fallback: '/provider/dashboard' },
  { prefix: '/provider/support', moduleId: 'provider_operations', fallback: '/provider/dashboard' },
  { prefix: '/provider/messages', moduleId: 'provider_operations', fallback: '/provider/dashboard' },
  { prefix: '/provider/documents', moduleId: 'provider_operations', fallback: '/provider/dashboard' },
  { prefix: '/provider/patients', moduleId: 'provider_operations', fallback: '/provider/dashboard' },
  { prefix: '/provider/payments', moduleId: 'provider_operations', fallback: '/provider/dashboard' },
  { prefix: '/provider/claims', moduleId: 'provider_operations', fallback: '/provider/dashboard' },
  { prefix: '/provider/authorizations', moduleId: 'provider_operations', fallback: '/provider/dashboard' },
  { prefix: '/provider/eligibility', moduleId: 'provider_operations', fallback: '/provider/dashboard' },
  { prefix: '/provider/dashboard', moduleId: 'provider_operations', fallback: '/login' },
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

const routePermissionMap: Array<{ prefix: string; requiredPermissions: string[]; fallback: string }> = [
  { prefix: '/provider/admin', requiredPermissions: ['tenant.view', 'provider.admin.manage'], fallback: '/provider/dashboard' },
  { prefix: '/provider/support', requiredPermissions: ['tenant.view', 'provider.support.view'], fallback: '/provider/dashboard' },
  { prefix: '/provider/messages', requiredPermissions: ['tenant.view', 'provider.messages.view'], fallback: '/provider/dashboard' },
  { prefix: '/provider/documents', requiredPermissions: ['tenant.view', 'provider.documents.view'], fallback: '/provider/dashboard' },
  { prefix: '/provider/patients', requiredPermissions: ['tenant.view', 'provider.patients.view'], fallback: '/provider/dashboard' },
  { prefix: '/provider/payments', requiredPermissions: ['tenant.view', 'provider.claims.view'], fallback: '/provider/dashboard' },
  { prefix: '/provider/claims', requiredPermissions: ['tenant.view', 'provider.claims.view'], fallback: '/provider/dashboard' },
  { prefix: '/provider/authorizations', requiredPermissions: ['tenant.view', 'provider.authorizations.view'], fallback: '/provider/dashboard' },
  { prefix: '/provider/eligibility', requiredPermissions: ['tenant.view', 'provider.eligibility.view'], fallback: '/provider/dashboard' },
  { prefix: '/provider/dashboard', requiredPermissions: ['tenant.view', 'provider.view'], fallback: '/login' }
];

function toLoginRedirect(request: NextRequest) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = '/login';
  redirectUrl.search = '';
  return NextResponse.redirect(redirectUrl);
}

async function readPortalSessionFromRequest(request: NextRequest) {
  for (const cookieName of getPortalSessionCookieNames()) {
    const portalSession = await readPortalSessionEnvelopeFromCookie(
      request.cookies.get(cookieName)?.value
    );

    if (portalSession) {
      return portalSession;
    }
  }

  return null;
}

function hasRequiredPermissions(
  currentPermissions: string[],
  requiredPermissions: string[]
) {
  return requiredPermissions.every((permission) => currentPermissions.includes(permission));
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isApiRoute = pathname === '/api' || pathname.startsWith('/api/');
  const demoAccessCookie = request.cookies.get(DEMO_ACCESS_COOKIE)?.value ?? '';
  const hasDemoAccess = Boolean(findDemoUser(demoAccessCookie));
  const isDemoAccessApi = pathname === '/api/demo-access';
  const isProtectedDemoPage =
    pathname === '/login' ||
    pathname.startsWith('/login') ||
    pathname === '/provider-login' ||
    pathname.startsWith('/provider-login') ||
    pathname === '/employer-login' ||
    pathname.startsWith('/employer-login');
  const isProtectedDemoAuthApi =
    pathname === '/api/auth/login' ||
    pathname === '/api/auth/login/employer' ||
    pathname === '/api/auth/login/catalog' ||
    pathname === '/api/auth/login/auto';

  if (isDemoAccessApi) {
    return NextResponse.next();
  }

  if (isProtectedDemoPage && !hasDemoAccess) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/';
    redirectUrl.search = '';
    return NextResponse.redirect(redirectUrl);
  }

  if (isProtectedDemoAuthApi && !hasDemoAccess) {
    return NextResponse.json({ message: 'Demo access required.' }, { status: 403 });
  }

  if (
    isApiRoute &&
    pathname !== '/api/auth/login' &&
    pathname !== '/api/auth/login/employer' &&
    pathname !== '/api/auth/login/provider' &&
    pathname !== '/api/auth/login/catalog' &&
    pathname !== '/api/auth/login/auto' &&
    pathname !== '/api/auth/logout' &&
    pathname !== '/api/auth/session'
  ) {
    const portalSession = await readPortalSessionFromRequest(request);
    const portalUser = portalSession?.user as PortalUserCookie | null;

    if (!portalUser || !portalSession?.accessToken) {
      return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
    }

    const tenantId =
      portalUser.session?.tenantId ??
      portalUser.tenant?.id ??
      null;

    if (!tenantId) {
      return NextResponse.json(
        { message: 'Tenant context required. No default tenant fallback is available.' },
        { status: 403 }
      );
    }

    const response = NextResponse.next();
    response.headers.set('x-tenant-id', tenantId);
    return response;
  }

  const route = routeModuleMap.find((item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`));
  const permissionRoute = routePermissionMap.find((item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`));

  if (!route) {
    return NextResponse.next();
  }

  const portalSession = await readPortalSessionFromRequest(request);
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
  const permissions = portalUser?.permissions ?? portalUser?.session?.permissions ?? [];

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

  if (permissionRoute && !hasRequiredPermissions(permissions, permissionRoute.requiredPermissions)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = permissionRoute.fallback;
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
  matcher: [
    '/',
    '/login',
    '/provider-login',
    '/employer-login',
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
    '/api',
    '/api/:path*',
    '/tenant-admin',
    '/tenant-admin/:path*'
  ]
};
