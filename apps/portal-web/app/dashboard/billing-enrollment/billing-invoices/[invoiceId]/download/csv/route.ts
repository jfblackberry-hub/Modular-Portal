import { NextResponse } from 'next/server';

import { getEmployerDashboard } from '../../../../../../../lib/billing-enrollment-api';
import { getEmployerInvoiceByIdForTenant, toInvoiceCsv } from '../../../../../../../lib/employer-billing-data';
import { getPortalSessionUser } from '../../../../../../../lib/portal-session';

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

  const csv = toInvoiceCsv([invoice]);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.csv"`
    }
  });
}
