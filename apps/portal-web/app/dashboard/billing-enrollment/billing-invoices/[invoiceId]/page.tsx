import { notFound } from 'next/navigation';

import { EmployerInvoiceDetailView } from '../../../../../components/billing-enrollment/EmployerInvoiceDetailView';
import { getEmployerDashboard } from '../../../../../lib/billing-enrollment-api';
import { getEmployerBillingDatasetForTenant } from '../../../../../lib/employer-billing-data';
import { getPortalSessionUser } from '../../../../../lib/portal-session';

export default async function EmployerInvoiceDetailPage({
  params
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const { invoiceId } = await params;
  const user = await getPortalSessionUser();
  const tenantId = user?.tenant.id ?? 'unknown-tenant';
  const employerName = user?.tenant.name ?? 'Employer';
  const dashboard = user ? await getEmployerDashboard(user.id).catch(() => null) : null;

  const dataset = getEmployerBillingDatasetForTenant(tenantId, employerName, dashboard?.billingSummary);
  const invoice = dataset.invoices.find((item) => item.id === invoiceId);

  if (!invoice) {
    notFound();
  }

  return <EmployerInvoiceDetailView invoice={invoice} payments={dataset.payments} />;
}
