import { BrokerEnrollmentsWorkspacePage } from '../../../components/billing-enrollment/BrokerEnrollmentsWorkspacePage';
import { getBrokerPortfolioGroups, getBrokerTasks } from '../../../lib/broker-portfolio-data';

export default function BrokerEnrollmentsPage() {
  return (
    <BrokerEnrollmentsWorkspacePage
      groups={getBrokerPortfolioGroups()}
      tasks={getBrokerTasks()}
    />
  );
}
