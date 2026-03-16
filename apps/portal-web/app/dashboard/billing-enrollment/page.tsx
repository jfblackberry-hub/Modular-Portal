import { BillingEnrollmentDashboard } from '../../../components/billing-enrollment/BillingEnrollmentDashboard';
import { EmployerCommandCenterDashboard } from '../../../components/billing-enrollment/EmployerCommandCenterDashboard';
import { getPortalImageSrc } from '../../../lib/portal-image-registry';
import { getPortalSessionUser } from '../../../lib/portal-session';

export default async function BillingEnrollmentOverviewPage({
  searchParams
}: {
  searchParams: Promise<{ mode?: 'live' | 'mock' | 'empty' | 'error' }>;
}) {
  const { mode } = await searchParams;
  const sessionUser = await getPortalSessionUser();
  const billingHeroImage = getPortalImageSrc('billingEnrollmentHero', {
    tenantBrandingConfig: sessionUser?.tenant.brandingConfig
  });
  const isEmployerExperience =
    sessionUser?.landingContext === 'employer' ||
    sessionUser?.roles.includes('employer_group_admin') ||
    false;

  if (isEmployerExperience) {
    return (
      <EmployerCommandCenterDashboard
        mode={mode ?? 'live'}
        employerName={sessionUser?.tenant.name ?? 'Employer'}
        tenantId={sessionUser?.tenant.id ?? 'unknown-tenant'}
      />
    );
  }

  return (
    <BillingEnrollmentDashboard
      mode={mode ?? 'live'}
      heroImageSrc={billingHeroImage}
    />
  );
}
