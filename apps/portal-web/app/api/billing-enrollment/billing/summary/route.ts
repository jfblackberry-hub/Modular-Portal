import { NextResponse } from 'next/server';

import { getBillingSummary } from '../../../../../lib/billing-enrollment-api';
import { getPortalSessionUser } from '../../../../../lib/portal-session';

export async function GET() {
  const user = await getPortalSessionUser();

  if (!user) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  try {
    const summary = await getBillingSummary(user.id);
    return NextResponse.json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load billing summary.';
    return NextResponse.json({ message }, { status: 502 });
  }
}
