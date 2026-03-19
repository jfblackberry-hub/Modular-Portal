import { BrokerSupportWorkspacePage } from '../../../components/billing-enrollment/BrokerSupportWorkspacePage';
import { getBrokerSupportResources } from '../../../lib/broker-operations-data';

export default function BrokerSupportPage() {
  return <BrokerSupportWorkspacePage resources={getBrokerSupportResources()} />;
}
