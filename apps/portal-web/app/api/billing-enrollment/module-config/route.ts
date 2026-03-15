import { NextResponse } from 'next/server';

import { getBillingEnrollmentModuleConfig } from '../../../../lib/billing-enrollment-api';
import { getPortalSessionUser } from '../../../../lib/portal-session';

export async function GET() {
  const user = await getPortalSessionUser();

  if (!user) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  try {
    const config = await getBillingEnrollmentModuleConfig(user.id);
    return NextResponse.json(config);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to load billing enrollment module configuration.';
    return NextResponse.json({ message }, { status: 502 });
  }
}
