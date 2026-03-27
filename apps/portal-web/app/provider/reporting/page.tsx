import { ProviderReportingWorkspace } from '../../../components/provider/operations/provider-reporting-workspace';
import { resolveProviderClinicName } from '../../../lib/provider-hero-branding';
import { getProviderOperationsDashboardSnapshot } from '../../../lib/provider-operations-snapshot';

export default async function ProviderReportingRoutePage() {
  const { config, user } = await getProviderOperationsDashboardSnapshot();
  const clinicName = resolveProviderClinicName({
    tenantBrandingConfig: user.tenant.brandingConfig,
    practiceName: config.providerContext.practiceName
  });

  return <ProviderReportingWorkspace clinicName={clinicName} />;
}
