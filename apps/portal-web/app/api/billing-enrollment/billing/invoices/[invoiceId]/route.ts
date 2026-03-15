import { NextResponse } from 'next/server';

import { getInvoiceDetail } from '../../../../../../lib/billing-enrollment-api';
import { getPortalSessionUser } from '../../../../../../lib/portal-session';

export async function GET(_request: Request, context: { params: Promise<{ invoiceId: string }> }) {
  const user = await getPortalSessionUser();

  if (!user) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  const { invoiceId } = await context.params;

  try {
    const detail = await getInvoiceDetail(user.id, invoiceId);
    return NextResponse.json(detail);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load invoice detail.';
    return NextResponse.json({ message }, { status: 502 });
  }
}
