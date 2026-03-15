import { NextResponse } from 'next/server';

import { getNoticeDetail } from '../../../../../lib/billing-enrollment-api';
import { getPortalSessionUser } from '../../../../../lib/portal-session';

export async function GET(_request: Request, context: { params: Promise<{ noticeId: string }> }) {
  const user = await getPortalSessionUser();

  if (!user) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  const { noticeId } = await context.params;

  try {
    const response = await getNoticeDetail(user.id, noticeId);
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load notice detail.';
    return NextResponse.json({ message }, { status: 502 });
  }
}
