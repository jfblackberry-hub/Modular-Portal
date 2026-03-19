import { BrokerTasksCasesWorkspacePage } from '../../../components/billing-enrollment/BrokerTasksCasesWorkspacePage';
import { getBrokerCases, getBrokerCasesFilterOptions } from '../../../lib/broker-operations-data';

export default function BrokerTasksPage() {
  return (
    <BrokerTasksCasesWorkspacePage
      cases={getBrokerCases()}
      filterOptions={getBrokerCasesFilterOptions()}
    />
  );
}
