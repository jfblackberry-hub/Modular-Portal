import { BrokerDocumentsWorkspacePage } from '../../../components/billing-enrollment/BrokerDocumentsWorkspacePage';
import { getBrokerDocumentFilterOptions, getBrokerDocuments } from '../../../lib/broker-operations-data';

export default function BrokerDocumentsPage() {
  return (
    <BrokerDocumentsWorkspacePage
      documents={getBrokerDocuments()}
      filterOptions={getBrokerDocumentFilterOptions()}
    />
  );
}
