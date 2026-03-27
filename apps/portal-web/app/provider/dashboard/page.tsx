import { ProviderDashboardPage } from '../../../components/provider/provider-dashboard-page';
import {
  resolveProviderClinicName,
  resolveProviderGreetingName
} from '../../../lib/provider-hero-branding';
import { getProviderOperationsDashboardSnapshot } from '../../../lib/provider-operations-snapshot';

export default async function ProviderDashboardRoutePage() {
  const { config, dashboard, user } =
    await getProviderOperationsDashboardSnapshot();
  const clinicName = resolveProviderClinicName({
    tenantBrandingConfig: user.tenant.brandingConfig,
    practiceName: config.providerContext.practiceName
  });
  const providerName = resolveProviderGreetingName({
    firstName: user.firstName,
    lastName: user.lastName,
    configuredProviderName: config.providerContext.providerName
  });

  return (
    <ProviderDashboardPage
      clinicName={clinicName}
      dashboard={dashboard}
      providerName={providerName}
    />
  );
}
