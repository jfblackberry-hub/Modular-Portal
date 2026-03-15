import { NextResponse } from 'next/server';

import { uploadDocument } from '../../../../../lib/billing-enrollment-api';
import { getPortalSessionUser } from '../../../../../lib/portal-session';

export async function POST(request: Request) {
  const user = await getPortalSessionUser();

  if (!user) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  const body = (await request.json()) as {
    requestId: string;
    documentName: string;
  };

  try {
    const response = await uploadDocument(user.id, body);
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to upload document.';
    return NextResponse.json({ message }, { status: 502 });
  }
}
