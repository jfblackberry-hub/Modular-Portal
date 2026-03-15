import { ProviderRoutePage } from '../../../components/provider/provider-route-page';
import { getProviderPortalSessionContext } from '../../../lib/provider-portal-session';

export default async function ProviderRouteScaffoldPage() {
  const { variant } = await getProviderPortalSessionContext();

  return <ProviderRoutePage routeKey='patients' variant={variant} />;
}
