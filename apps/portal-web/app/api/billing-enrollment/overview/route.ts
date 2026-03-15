import { NextResponse } from 'next/server';

import { getBillingEnrollmentOverview } from '../../../../lib/billing-enrollment-api';
import { getPortalSessionUser } from '../../../../lib/portal-session';

export async function GET() {
  const user = await getPortalSessionUser();

  if (!user) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  try {
    const overview = await getBillingEnrollmentOverview(user.id);
    return NextResponse.json(overview);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load Billing & Enrollment overview.';
    return NextResponse.json({ message }, { status: 502 });
  }
}
