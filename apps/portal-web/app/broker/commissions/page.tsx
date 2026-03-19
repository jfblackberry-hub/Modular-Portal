import { BrokerCommissionsWorkspacePage } from '../../../components/billing-enrollment/BrokerCommissionsWorkspacePage';
import { getBrokerCommissionRecords } from '../../../lib/broker-operations-data';

export default function BrokerCommissionsPage() {
  return <BrokerCommissionsWorkspacePage records={getBrokerCommissionRecords()} />;
}
