import { NextResponse } from 'next/server';

import { getEmployerDashboard } from '../../../../../../../lib/billing-enrollment-api';
import { getEmployerInvoiceByIdForTenant } from '../../../../../../../lib/employer-billing-data';
import { createMockPdfBuffer } from '../../../../../../../lib/mock-pdf';
import { getPortalSessionUser } from '../../../../../../../lib/portal-session';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
}

export async function GET(
  _: Request,
  context: { params: Promise<{ invoiceId: string }> }
) {
  const user = await getPortalSessionUser();

  if (!user) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  const { invoiceId } = await context.params;
  const dashboard = await getEmployerDashboard(user.id).catch(() => null);
  const invoice = getEmployerInvoiceByIdForTenant(
    user.tenant.id,
    invoiceId,
    user.tenant.name,
    dashboard?.billingSummary
  );

  if (!invoice) {
    return NextResponse.json({ message: 'Invoice not found.' }, { status: 404 });
  }

  const content = [
    `Invoice: ${invoice.invoiceNumber}`,
    `Employer: ${invoice.employerName}`,
    `Billing period: ${invoice.billingCycleLabel}`,
    `Due date: ${invoice.dueDate}`,
    `Invoice amount: ${formatCurrency(invoice.invoiceAmount)}`,
    `Outstanding balance: ${formatCurrency(invoice.outstandingBalance)}`,
    '',
    'Line items:',
    ...invoice.lineItems.map((lineItem) => `- ${lineItem.category}: ${lineItem.description} (${formatCurrency(lineItem.amount)})`)
  ].join('\n');

  return new NextResponse(createMockPdfBuffer(invoice.invoiceNumber, content.split('\n')), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`
    }
  });
}
