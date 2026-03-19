import { BrokerQuotesWorkspacePage } from '../../../components/billing-enrollment/BrokerQuotesWorkspacePage';
import { getBrokerQuotes } from '../../../lib/broker-sales-workspace-data';

export default function BrokerQuotesPage() {
  return <BrokerQuotesWorkspacePage quotes={getBrokerQuotes()} />;
}
