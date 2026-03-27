import { ProviderUtilizationWorkspace } from '../../../components/provider/operations/provider-workspaces';
import { resolveProviderClinicName } from '../../../lib/provider-hero-branding';
import { getProviderOperationsDashboardSnapshot } from '../../../lib/provider-operations-snapshot';

export default async function ProviderUtilizationRoutePage() {
  const { config, dashboard, user } = await getProviderOperationsDashboardSnapshot();
  const clinicName = resolveProviderClinicName({
    tenantBrandingConfig: user.tenant.brandingConfig,
    practiceName: config.providerContext.practiceName
  });

  return <ProviderUtilizationWorkspace clinicName={clinicName} dashboard={dashboard} />;
}
