import { NextResponse } from 'next/server';

import { getEmployerDashboard } from '../../../../../lib/billing-enrollment-api';
import { getEmployerBillingDatasetForTenant, toInvoiceCsv } from '../../../../../lib/employer-billing-data';
import { getPortalSessionUser } from '../../../../../lib/portal-session';

export async function GET() {
  const user = await getPortalSessionUser();

  if (!user) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  const dashboard = await getEmployerDashboard(user.id).catch(() => null);
  const dataset = getEmployerBillingDatasetForTenant(
    user.tenant.id,
    user.tenant.name,
    dashboard?.billingSummary
  );

  if (dataset.invoices.length === 0) {
    return NextResponse.json({ message: 'No billing data available for export.' }, { status: 404 });
  }

  const csv = toInvoiceCsv(dataset.invoices);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="billing-export.csv"'
    }
  });
}
