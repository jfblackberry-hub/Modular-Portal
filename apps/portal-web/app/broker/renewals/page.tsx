import { BrokerRenewalsWorkspacePage } from '../../../components/billing-enrollment/BrokerRenewalsWorkspacePage';
import { getBrokerRenewalsGroupedByWindow } from '../../../lib/broker-sales-workspace-data';

export default function BrokerRenewalsPage() {
  return <BrokerRenewalsWorkspacePage groupedRenewals={getBrokerRenewalsGroupedByWindow()} />;
}
