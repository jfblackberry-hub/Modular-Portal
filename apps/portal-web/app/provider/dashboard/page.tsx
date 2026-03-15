import { ProviderDashboardPage } from '../../../components/provider/provider-dashboard-page';
import { getProviderPortalSessionContext } from '../../../lib/provider-portal-session';

export default async function ProviderDashboardRoutePage() {
  const { variant } = await getProviderPortalSessionContext();

  return <ProviderDashboardPage variant={variant} />;
}
