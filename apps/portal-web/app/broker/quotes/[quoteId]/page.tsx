import { notFound } from 'next/navigation';

import { BrokerQuoteDetailPage } from '../../../../components/billing-enrollment/BrokerQuoteDetailPage';
import { getBrokerQuote, getBrokerQuoteGroupContext } from '../../../../lib/broker-sales-workspace-data';

export default async function BrokerQuoteDetailRoute({
  params
}: {
  params: Promise<{ quoteId: string }>;
}) {
  const { quoteId } = await params;
  const quote = getBrokerQuote(quoteId);

  if (!quote) {
    notFound();
  }

  return <BrokerQuoteDetailPage quote={quote} group={getBrokerQuoteGroupContext(quote)} />;
}
