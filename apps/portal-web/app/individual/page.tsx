import { BillingEnrollmentDashboard } from '../../components/billing-enrollment/BillingEnrollmentDashboard';
import { getPortalImageSrc } from '../../lib/portal-image-registry';
import { getPortalSessionUser } from '../../lib/portal-session';

export default async function IndividualPortalHomePage() {
  const sessionUser = await getPortalSessionUser();
  const billingHeroImage = getPortalImageSrc('billingEnrollmentHero', {
    tenantBrandingConfig: sessionUser?.tenant.brandingConfig
  });

  return (
    <BillingEnrollmentDashboard
      mode="live"
      heroImageSrc={billingHeroImage}
    />
  );
}
