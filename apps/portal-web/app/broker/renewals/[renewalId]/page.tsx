import { notFound } from 'next/navigation';

import { BrokerRenewalDetailPage } from '../../../../components/billing-enrollment/BrokerRenewalDetailPage';
import { getBrokerRenewal, getBrokerRenewalGroupContext } from '../../../../lib/broker-sales-workspace-data';

export default async function BrokerRenewalDetailRoute({
  params
}: {
  params: Promise<{ renewalId: string }>;
}) {
  const { renewalId } = await params;
  const renewal = getBrokerRenewal(renewalId);

  if (!renewal) {
    notFound();
  }

  return <BrokerRenewalDetailPage renewal={renewal} group={getBrokerRenewalGroupContext(renewal)} />;
}
