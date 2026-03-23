import { NextResponse } from 'next/server';

import { apiInternalOrigin } from '../../../../lib/server-runtime';

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get('authorization');
    const tenantId = request.headers.get('x-tenant-id');

    if (!authorization) {
      return NextResponse.json(
        { message: 'Authenticated admin session required.' },
        { status: 401 }
      );
    }

    const response = await fetch(`${apiInternalOrigin}/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: authorization,
        ...(tenantId
          ? {
              'x-tenant-id': tenantId
            }
          : {})
      },
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
