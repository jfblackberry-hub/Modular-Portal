import { NextResponse } from 'next/server';

import { updateBillingAutopay } from '../../../../../lib/billing-enrollment-api';
import { getPortalSessionUser } from '../../../../../lib/portal-session';

export async function PUT(request: Request) {
  const user = await getPortalSessionUser();

  if (!user) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  const body = (await request.json()) as {
    enabled: boolean;
    paymentMethodTokenId?: string;
  };

  try {
    const result = await updateBillingAutopay(user.id, body);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update autopay.';
    return NextResponse.json({ message }, { status: 502 });
  }
}
