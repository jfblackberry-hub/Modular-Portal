import { BrokerNewQuoteFlowPage } from '../../../../components/billing-enrollment/BrokerNewQuoteFlowPage';
import { getPortalSessionUser } from '../../../../lib/portal-session';

export default async function BrokerNewQuotePage() {
  const sessionUser = await getPortalSessionUser();
  const brokerName = `${sessionUser?.firstName ?? 'Avery'} ${sessionUser?.lastName ?? 'Lee'}`;

  return <BrokerNewQuoteFlowPage brokerName={brokerName} />;
}
