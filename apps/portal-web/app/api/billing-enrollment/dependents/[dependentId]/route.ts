import { NextResponse } from 'next/server';

import { removeDependent, updateDependent } from '../../../../../lib/billing-enrollment-api';
import { getPortalSessionUser } from '../../../../../lib/portal-session';

export async function PATCH(request: Request, context: { params: Promise<{ dependentId: string }> }) {
  const user = await getPortalSessionUser();

  if (!user) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  const { dependentId } = await context.params;
  const body = (await request.json()) as {
    householdId: string;
    firstName: string;
    lastName: string;
    dob: string;
    relationship: 'spouse' | 'child' | 'other';
    relationshipDetail: string;
  };

  try {
    const response = await updateDependent(user.id, dependentId, body);
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update dependent.';
    return NextResponse.json({ message }, { status: 502 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ dependentId: string }> }) {
  const user = await getPortalSessionUser();

  if (!user) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  const { dependentId } = await context.params;
  const { searchParams } = new URL(request.url);
  const householdId = searchParams.get('householdId') ?? 'hh-8843';

  try {
    const response = await removeDependent(user.id, dependentId, householdId);
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to remove dependent.';
    return NextResponse.json({ message }, { status: 502 });
  }
}
