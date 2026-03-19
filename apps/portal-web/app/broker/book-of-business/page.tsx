import { BrokerBookOfBusinessPage as BrokerBookOfBusinessWorkspace } from '../../../components/billing-enrollment/BrokerBookOfBusinessPage';
import { getBrokerFilterOptions, getBrokerPortfolioGroups } from '../../../lib/broker-portfolio-data';

export default function BrokerBookOfBusinessRoute() {
  return (
    <BrokerBookOfBusinessWorkspace
      groups={getBrokerPortfolioGroups()}
      filterOptions={getBrokerFilterOptions()}
    />
  );
}
