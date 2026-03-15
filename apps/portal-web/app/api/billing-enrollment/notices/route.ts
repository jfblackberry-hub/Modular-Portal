import { NextResponse } from 'next/server';

import { getCorrespondenceCenter } from '../../../../lib/billing-enrollment-api';
import { getPortalSessionUser } from '../../../../lib/portal-session';

export async function GET(request: Request) {
  const user = await getPortalSessionUser();

  if (!user) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get('unreadOnly') === 'true';

  try {
    const response = await getCorrespondenceCenter(user.id, unreadOnly);
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load notices.';
    return NextResponse.json({ message }, { status: 502 });
  }
}
