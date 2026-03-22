import { redirect } from 'next/navigation';

import BrokerCommissionsPage from '../../../broker/commissions/page';
import BrokerDocumentsPage from '../../../broker/documents/page';
import BrokerEnrollmentsPage from '../../../broker/enrollments/page';
import BrokerHomePage from '../../../broker/page';
import BrokerQuotesPage from '../../../broker/quotes/page';
import BrokerRenewalsPage from '../../../broker/renewals/page';
import BrokerSupportPage from '../../../broker/support/page';
import BrokerTasksPage from '../../../broker/tasks/page';
import BrokerBookOfBusinessPage from '../../../broker/book-of-business/page';
import DashboardAuthorizationsPage from '../../../dashboard/authorizations/page';
import DashboardBenefitsPage from '../../../dashboard/benefits/page';
import DashboardCareCostEstimatorPage from '../../../dashboard/care-cost-estimator/page';
import DashboardClaimsPage from '../../../dashboard/claims/page';
import DashboardDocumentsPage from '../../../dashboard/documents/page';
import DashboardHelpPage from '../../../dashboard/help/page';
import DashboardHomePage from '../../../dashboard/page';
import DashboardIdCardPage from '../../../dashboard/id-card/page';
import DashboardMessagesPage from '../../../dashboard/messages/page';
import DashboardProvidersPage from '../../../dashboard/providers/page';
import DashboardSearchPage from '../../../dashboard/search/page';
import EmployerAdminPage from '../../../employer/admin/page';
import EmployerBillingPage from '../../../employer/billing/page';
import EmployerDocumentsPage from '../../../employer/documents/page';
import EmployerEligibilityChangesPage from '../../../employer/eligibility-changes/page';
import EmployerEmployeesPage from '../../../employer/employees/page';
import EmployerEnrollmentPage from '../../../employer/enrollment/page';
import EmployerHomePage from '../../../employer/page';
import EmployerReportsPage from '../../../employer/reports/page';
import EmployerSupportPage from '../../../employer/support/page';
import IndividualBillingPaymentsPage from '../../../individual/billing-payments/page';
import IndividualDocumentsPage from '../../../individual/documents/page';
import IndividualHouseholdPage from '../../../individual/household/page';
import IndividualApplicationPage from '../../../individual/my-application/page';
import IndividualCoveragePage from '../../../individual/my-coverage/page';
import IndividualHomePage from '../../../individual/page';
import IndividualProfilePage from '../../../individual/profile/page';
import IndividualShopPlansPage from '../../../individual/shop-plans/page';
import IndividualSupportPage from '../../../individual/support/page';
import ProviderAdminPage from '../../../provider/admin/page';
import ProviderAuthorizationsPage from '../../../provider/authorizations/page';
import ProviderClaimsPage from '../../../provider/claims/page';
import ProviderDashboardPage from '../../../provider/dashboard/page';
import ProviderDocumentsPage from '../../../provider/documents/page';
import ProviderEligibilityPage from '../../../provider/eligibility/page';
import ProviderMessagesPage from '../../../provider/messages/page';
import ProviderPatientsPage from '../../../provider/patients/page';
import ProviderPaymentsPage from '../../../provider/payments/page';
import ProviderSupportPage from '../../../provider/support/page';
import { PortalShell } from '../../../../components/portal-shell';
import { ProviderPortalLayout } from '../../../../components/provider/provider-portal-layout';
import { PreviewRouteUnavailable } from '../../../../components/preview-route-unavailable';
import { TenantTheme } from '../../../../components/tenant-theme';
import { TenantAdminShell } from '../../../../components/tenant-admin/tenant-admin-shell';
import {
  TenantAdminAuditWorkspace,
  TenantAdminConfigurationWorkspace,
  TenantAdminDashboardWorkspace,
  TenantAdminIntegrationsWorkspace,
  TenantAdminRolesWorkspace,
  TenantAdminSubtenantsWorkspace,
  TenantAdminUsersWorkspace
} from '../../../../components/tenant-admin/tenant-admin-workspaces';
import { getBrokerNavigationSections } from '../../../../lib/broker-portal-config';
import { billingPortalNavigationByAudience } from '../../../../lib/billing-portal-audience';
import { buildPortalNavigation } from '../../../../lib/navigation';
import { resolvePortalExperience } from '../../../../lib/portal-experience';
import { getPortalSessionUser } from '../../../../lib/portal-session';
import { getEnabledPlugins } from '../../../../lib/plugins';
import { getProviderPortalConfig } from '../../../../config/providerPortalConfig';
import { getProviderPortalSessionContext } from '../../../../lib/provider-portal-session';
import { resolveProviderClinicLogoSrc } from '../../../../lib/provider-hero-branding';
import { getTenantAdminWorkspaceData } from '../../../../lib/tenant-admin-data';
import { getTenantBranding } from '../../../../lib/tenant-branding';

function normalizePath(slug: string[] | undefined) {
  if (!slug || slug.length === 0) {
    return '';
  }

  return `/${slug.join('/')}`;
}

function renderPreviewRoute(
  pathname: string,
  portalType: string,
  query?: string,
  tenantAdminWorkspace?: ReturnType<typeof getTenantAdminWorkspaceData>
) {
  switch (pathname) {
    case '/dashboard':
      return <DashboardHomePage />;
    case '/dashboard/benefits':
      return <DashboardBenefitsPage />;
    case '/dashboard/claims':
      return <DashboardClaimsPage />;
    case '/dashboard/id-card':
      return <DashboardIdCardPage />;
    case '/dashboard/providers':
      return <DashboardProvidersPage />;
    case '/dashboard/authorizations':
      return <DashboardAuthorizationsPage />;
    case '/dashboard/messages':
      return <DashboardMessagesPage />;
    case '/dashboard/documents':
      return <DashboardDocumentsPage />;
    case '/dashboard/help':
      return <DashboardHelpPage />;
    case '/dashboard/care-cost-estimator':
      return <DashboardCareCostEstimatorPage />;
    case '/dashboard/search':
      return <DashboardSearchPage searchParams={Promise.resolve({ q: query })} />;
    case '/provider':
    case '/provider/dashboard':
      return <ProviderDashboardPage />;
    case '/provider/eligibility':
      return <ProviderEligibilityPage />;
    case '/provider/authorizations':
      return <ProviderAuthorizationsPage />;
    case '/provider/claims':
      return <ProviderClaimsPage />;
    case '/provider/payments':
      return <ProviderPaymentsPage />;
    case '/provider/patients':
      return <ProviderPatientsPage />;
    case '/provider/documents':
      return <ProviderDocumentsPage />;
    case '/provider/messages':
      return <ProviderMessagesPage />;
    case '/provider/support':
      return <ProviderSupportPage />;
    case '/provider/admin':
      return <ProviderAdminPage />;
    case '/broker':
      return <BrokerHomePage />;
    case '/broker/book-of-business':
      return <BrokerBookOfBusinessPage />;
    case '/broker/quotes':
      return <BrokerQuotesPage />;
    case '/broker/renewals':
      return <BrokerRenewalsPage />;
    case '/broker/enrollments':
      return <BrokerEnrollmentsPage />;
    case '/broker/commissions':
      return <BrokerCommissionsPage />;
    case '/broker/documents':
      return <BrokerDocumentsPage />;
    case '/broker/tasks':
      return <BrokerTasksPage />;
    case '/broker/support':
      return <BrokerSupportPage />;
    case '/employer':
      return <EmployerHomePage />;
    case '/employer/employees':
    case '/dashboard/billing-enrollment/employees':
      return <EmployerEmployeesPage />;
    case '/employer/enrollment':
    case '/dashboard/billing-enrollment/open-enrollment':
      return <EmployerEnrollmentPage />;
    case '/employer/eligibility-changes':
    case '/dashboard/billing-enrollment/enrollment-activity':
      return <EmployerEligibilityChangesPage />;
    case '/employer/billing':
    case '/dashboard/billing-enrollment/billing-overview':
      return <EmployerBillingPage />;
    case '/employer/reports':
    case '/dashboard/billing-enrollment/reports':
      return <EmployerReportsPage />;
    case '/employer/documents':
    case '/dashboard/billing-enrollment/document-center':
      return <EmployerDocumentsPage />;
    case '/employer/support':
      return <EmployerSupportPage />;
    case '/employer/admin':
    case '/dashboard/billing-enrollment/administration':
      return <EmployerAdminPage />;
    case '/tenant-admin':
    case '/tenant-admin/dashboard':
      return tenantAdminWorkspace ? (
        <TenantAdminDashboardWorkspace summary={tenantAdminWorkspace.summary} />
      ) : null;
    case '/tenant-admin/configuration':
      return tenantAdminWorkspace ? (
        <TenantAdminConfigurationWorkspace
          profile={tenantAdminWorkspace.profile}
          notifications={tenantAdminWorkspace.notifications}
          billingPreferences={tenantAdminWorkspace.billingPreferences}
        />
      ) : null;
    case '/tenant-admin/users':
      return tenantAdminWorkspace ? (
        <TenantAdminUsersWorkspace administrators={tenantAdminWorkspace.administrators} />
      ) : null;
    case '/tenant-admin/roles':
      return tenantAdminWorkspace ? (
        <TenantAdminRolesWorkspace
          rolePermissions={tenantAdminWorkspace.rolePermissions}
          adminModules={tenantAdminWorkspace.adminModules}
        />
      ) : null;
    case '/tenant-admin/subtenants':
      return tenantAdminWorkspace ? (
        <TenantAdminSubtenantsWorkspace subtenants={tenantAdminWorkspace.subtenants} />
      ) : null;
    case '/tenant-admin/integrations':
      return tenantAdminWorkspace ? (
        <TenantAdminIntegrationsWorkspace integrations={tenantAdminWorkspace.integrations} />
      ) : null;
    case '/tenant-admin/audit':
      return tenantAdminWorkspace ? (
        <TenantAdminAuditWorkspace
          auditEvents={tenantAdminWorkspace.auditEvents.map((event) => ({
            id: event.id,
            tenantId: '',
            userId: null,
            eventType: event.actionType,
            resourceType: 'tenant',
            resourceId: event.affectedItem,
            beforeState: null,
            afterState: null,
            metadata: {
              actor: event.actor
            },
            ipAddress: null,
            userAgent: null,
            timestamp: event.timestamp
          }))}
        />
      ) : null;
    case '/individual':
      return <IndividualHomePage />;
    case '/individual/shop-plans':
      return <IndividualShopPlansPage />;
    case '/individual/my-application':
      return <IndividualApplicationPage />;
    case '/individual/my-coverage':
      return <IndividualCoveragePage />;
    case '/individual/household':
      return <IndividualHouseholdPage />;
    case '/individual/billing-payments':
      return <IndividualBillingPaymentsPage />;
    case '/individual/documents':
      return <IndividualDocumentsPage />;
    case '/individual/support':
      return <IndividualSupportPage />;
    case '/individual/profile':
      return <IndividualProfilePage />;
    case '/dashboard/billing-enrollment':
      if (portalType === 'employer') {
        return <EmployerHomePage />;
      }
      if (portalType === 'broker') {
        return <BrokerHomePage />;
      }
      return <IndividualHomePage />;
    default:
      return null;
  }
}

export default async function PreviewSessionCatchAllPage({
  params,
  searchParams
}: {
  params: Promise<{ sessionId: string; slug?: string[] }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { sessionId, slug } = await params;
  const resolvedSearchParams = await searchParams;
  const sessionUser = await getPortalSessionUser();

  if (!sessionUser?.previewSession || sessionUser.previewSession.id !== sessionId) {
    redirect('/preview/error?reason=missing-preview-session');
  }

  const previewBasePath = `/preview/${sessionId}`;
  const requestedPath = normalizePath(slug);
  const homePath = sessionUser.previewSession.homePath;
  const tenantAdminWorkspace =
    sessionUser.previewSession.portalType === 'tenant_admin'
      ? getTenantAdminWorkspaceData(sessionUser.tenant.id, sessionUser.tenant.name)
      : undefined;

  if (!requestedPath) {
    redirect(`${previewBasePath}${homePath}`);
  }

  const content = renderPreviewRoute(
    requestedPath,
    sessionUser.previewSession.portalType,
    resolvedSearchParams.q,
    tenantAdminWorkspace
  );

  if (!content) {
    const branding = await getTenantBranding(sessionUser.tenant, sessionUser.id, {
      experience: resolvePortalExperience(sessionUser)
    });

    if (sessionUser.previewSession.portalType === 'tenant_admin') {
      return (
        <>
          <TenantTheme branding={branding} />
          <TenantAdminShell routePrefix={previewBasePath} user={sessionUser}>
            <PreviewRouteUnavailable
              route={requestedPath}
              title="This route is unavailable in the current preview session"
              description="The requested tenant-admin path is outside the enabled preview map, missing a required entitlement, or unavailable for this tenant."
              type="failed_navigation_attempt"
            />
          </TenantAdminShell>
        </>
      );
    }

    return (
      <>
        <TenantTheme branding={branding} />
        <PortalShell
          branding={branding}
          navigation={
            sessionUser.previewSession.portalType === 'broker'
              ? getBrokerNavigationSections()
              : sessionUser.previewSession.portalType === 'employer'
                ? billingPortalNavigationByAudience.employer
                : billingPortalNavigationByAudience.individual
          }
          routePrefix={previewBasePath}
          searchBasePath={`${previewBasePath}/dashboard/search`}
          user={sessionUser}
        >
          <PreviewRouteUnavailable
            route={requestedPath}
            title="This route is unavailable in the current preview session"
            description="The requested path is outside the enabled module or entitlement set for this tenant persona, or it has not been mapped into the preview surface yet."
            type="failed_navigation_attempt"
          />
        </PortalShell>
      </>
    );
  }

  if (sessionUser.previewSession.portalType === 'provider') {
    const { user, variant } = await getProviderPortalSessionContext();
    const branding = await getTenantBranding(user.tenant, user.id, {
      experience: 'provider'
    });
    const config = getProviderPortalConfig(variant);
    const providerClinicLogoSrc = resolveProviderClinicLogoSrc({
      tenantBrandingConfig: user.tenant.brandingConfig
    });

    return (
      <>
        <TenantTheme branding={branding} />
        <ProviderPortalLayout
          branding={{
            ...branding,
            logoUrl: providerClinicLogoSrc
          }}
          config={config}
          routePrefix={previewBasePath}
          searchBasePath={`${previewBasePath}/provider/dashboard`}
          user={user}
        >
          {content}
        </ProviderPortalLayout>
      </>
    );
  }

  const branding = await getTenantBranding(sessionUser.tenant, sessionUser.id, {
    experience: resolvePortalExperience(sessionUser)
  });

  if (sessionUser.previewSession.portalType === 'broker') {
    return (
      <>
        <TenantTheme branding={branding} />
        <PortalShell
          branding={branding}
          navigation={getBrokerNavigationSections()}
          routePrefix={previewBasePath}
          searchBasePath={`${previewBasePath}/dashboard/search`}
          user={sessionUser}
        >
          {content}
        </PortalShell>
      </>
    );
  }

  if (sessionUser.previewSession.portalType === 'tenant_admin') {
    return (
      <>
        <TenantTheme branding={branding} />
        <TenantAdminShell routePrefix={previewBasePath} user={sessionUser}>
          {content}
        </TenantAdminShell>
      </>
    );
  }

  if (sessionUser.previewSession.portalType === 'employer') {
    return (
      <>
        <TenantTheme branding={branding} />
        <PortalShell
          branding={branding}
          navigation={billingPortalNavigationByAudience.employer}
          routePrefix={previewBasePath}
          searchBasePath={`${previewBasePath}/dashboard/search`}
          user={sessionUser}
        >
          {content}
        </PortalShell>
      </>
    );
  }

  const enabledPlugins = await getEnabledPlugins(sessionUser.tenant.id);
  const navigation = buildPortalNavigation(sessionUser, enabledPlugins);

  return (
    <>
      <TenantTheme branding={branding} />
      <PortalShell
        branding={branding}
        navigation={navigation}
        routePrefix={previewBasePath}
        searchBasePath={`${previewBasePath}/dashboard/search`}
        user={sessionUser}
      >
        {content}
      </PortalShell>
    </>
  );
}
