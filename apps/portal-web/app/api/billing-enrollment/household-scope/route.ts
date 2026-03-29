import { NextResponse } from 'next/server';

import { deriveBillingEnrollmentHouseholdId } from '../../../../lib/billing-household-id';
import { getPortalSessionUser } from '../../../../lib/portal-session';

export async function GET() {
  const user = await getPortalSessionUser();

  if (!user) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  if (user.session.type === 'platform_admin') {
    return NextResponse.json(
      { message: 'Tenant-scoped session is required to resolve household context.' },
      { status: 400 }
    );
  }

  const tenantId = user.session.tenantId;
  if (!tenantId?.trim()) {
    return NextResponse.json({ message: 'Tenant context is required.' }, { status: 400 });
  }

  try {
    const householdId = deriveBillingEnrollmentHouseholdId(tenantId, user.id);
    return NextResponse.json({ householdId });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to resolve household context.';
    return NextResponse.json({ message }, { status: 400 });
  }
}
