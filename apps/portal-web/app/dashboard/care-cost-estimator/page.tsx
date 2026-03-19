import { CareCostEstimatorPage } from '../../../components/member/care-cost-estimator/CareCostEstimatorPage';
import { getEstimatorBootstrap } from '../../../lib/care-cost-estimator/service';
import { getPortalSessionUser } from '../../../lib/portal-session';

export default async function CareCostEstimatorRoutePage() {
  const user = await getPortalSessionUser();
  const initialData = getEstimatorBootstrap(user);

  return <CareCostEstimatorPage initialData={initialData} />;
}
