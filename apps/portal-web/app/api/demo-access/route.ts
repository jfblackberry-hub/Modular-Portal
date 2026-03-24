import { NextResponse } from 'next/server';

import { DEMO_ACCESS_COOKIE, validateDemoCredentials } from '../../../lib/demo-access';

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 12;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      username?: string;
      password?: string;
    };

    const matchedUser = validateDemoCredentials(body.username ?? '', body.password ?? '');

    if (!matchedUser) {
      return NextResponse.json(
        { message: 'Invalid demo credentials.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      username: matchedUser.username
    });

    response.cookies.set(DEMO_ACCESS_COOKIE, matchedUser.username, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
      maxAge: COOKIE_MAX_AGE_SECONDS
    });

    return response;
  } catch {
    return NextResponse.json(
      { message: 'Unable to establish demo access right now.' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(DEMO_ACCESS_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
    maxAge: 0
  });
  return response;
}
