import { NextResponse } from 'next/server';

import { makeBillingPayment } from '../../../../../../lib/billing-enrollment-api';
import { getPortalSessionUser } from '../../../../../../lib/portal-session';

export async function POST(request: Request) {
  const user = await getPortalSessionUser();

  if (!user) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  const body = (await request.json()) as {
    billingAccountId: string;
    invoiceId: string;
    paymentMethodTokenId: string;
    amount: number;
  };

  try {
    const result = await makeBillingPayment(user.id, body);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to process payment.';
    return NextResponse.json({ message }, { status: 502 });
  }
}
