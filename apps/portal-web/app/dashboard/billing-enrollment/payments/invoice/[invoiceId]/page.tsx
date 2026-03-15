import { BillingExperience } from '../../../../../../components/billing-enrollment/BillingExperience';

export default async function BillingEnrollmentInvoiceDetailPage({
  params
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const { invoiceId } = await params;
  return <BillingExperience view="invoice-detail" invoiceId={invoiceId} />;
}
