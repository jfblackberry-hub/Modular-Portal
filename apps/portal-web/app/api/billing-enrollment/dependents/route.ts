import { NextResponse } from 'next/server';

import { addDependent, getDependentsExperience } from '../../../../lib/billing-enrollment-api';
import { getPortalSessionUser } from '../../../../lib/portal-session';

export async function GET(request: Request) {
  const user = await getPortalSessionUser();

  if (!user) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const householdId = searchParams.get('householdId') ?? 'hh-8843';

  try {
    const response = await getDependentsExperience(user.id, householdId);
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load dependents.';
    return NextResponse.json({ message }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const user = await getPortalSessionUser();

  if (!user) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  const body = (await request.json()) as {
    householdId: string;
    firstName: string;
    lastName: string;
    dob: string;
    relationship: 'spouse' | 'child' | 'other';
    relationshipDetail: string;
  };

  try {
    const response = await addDependent(user.id, body);
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to add dependent.';
    return NextResponse.json({ message }, { status: 502 });
  }
}
