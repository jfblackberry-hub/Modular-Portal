import { NextResponse } from 'next/server';

import { getEmployerDashboard } from '../../../../../lib/billing-enrollment-api';
import { getCurrentEmployerInvoiceForTenant } from '../../../../../lib/employer-billing-data';
import { getPortalSessionUser } from '../../../../../lib/portal-session';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
}

export async function GET() {
  const user = await getPortalSessionUser();

  if (!user) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  const dashboard = await getEmployerDashboard(user.id).catch(() => null);
  const invoice = getCurrentEmployerInvoiceForTenant(
    user.tenant.id,
    user.tenant.name,
    dashboard?.billingSummary
  );

  if (!invoice) {
    return NextResponse.json({ message: 'No invoice available for export.' }, { status: 404 });
  }

  const content = [
    `Statement export: ${invoice.invoiceNumber}`,
    `Employer: ${invoice.employerName}`,
    `Billing period: ${invoice.billingCycleLabel}`,
    `Total invoice: ${formatCurrency(invoice.invoiceAmount)}`,
    `Outstanding balance: ${formatCurrency(invoice.outstandingBalance)}`
  ].join('\n');

  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="billing-statement.pdf"'
    }
  });
}
