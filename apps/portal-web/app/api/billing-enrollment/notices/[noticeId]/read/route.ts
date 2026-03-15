import { NextResponse } from 'next/server';

import { markNoticeRead } from '../../../../../../lib/billing-enrollment-api';
import { getPortalSessionUser } from '../../../../../../lib/portal-session';

export async function POST(_request: Request, context: { params: Promise<{ noticeId: string }> }) {
  const user = await getPortalSessionUser();

  if (!user) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  const { noticeId } = await context.params;

  try {
    const response = await markNoticeRead(user.id, noticeId);
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update notice state.';
    return NextResponse.json({ message }, { status: 502 });
  }
}
