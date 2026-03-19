import { notFound } from 'next/navigation';

import { BrokerEmployerGroupDetailPage } from '../../../../components/billing-enrollment/BrokerEmployerGroupDetailPage';
import { getBrokerPortfolioGroup } from '../../../../lib/broker-portfolio-data';

export default async function BrokerEmployerGroupDetailRoute({
  params
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const group = getBrokerPortfolioGroup(groupId);

  if (!group) {
    notFound();
  }

  return <BrokerEmployerGroupDetailPage group={group} />;
}
