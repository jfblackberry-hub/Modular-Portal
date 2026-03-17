import { NextResponse } from 'next/server';

import { getPortalSession } from '../../../../lib/portal-session';

export async function GET() {
  try {
    const session = await getPortalSession();

    if (!session?.user || !session.accessToken) {
      return NextResponse.json(
        {
          sessionEstablished: false
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        sessionEstablished: true,
        user: {
          id: session.user.id,
          email: session.user.email
        }
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        sessionEstablished: false
      },
      { status: 200 }
    );
  }
}
