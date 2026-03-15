import { NextResponse } from 'next/server';

const apiBaseUrl =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  'http://localhost:3002';

export async function GET(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');
    const response = await fetch(`${apiBaseUrl}/auth/me`, {
      method: 'GET',
      headers: userId
        ? {
            'x-user-id': userId
          }
        : {},
      cache: 'no-store'
    });

    const payload = await response.text();

    return new NextResponse(payload, {
      status: response.status,
      headers: {
        'Content-Type':
          response.headers.get('content-type') ?? 'application/json'
      }
    });
  } catch {
    return NextResponse.json(
      { message: 'Local API unavailable. Start the API service and try again.' },
      { status: 503 }
    );
  }
}
