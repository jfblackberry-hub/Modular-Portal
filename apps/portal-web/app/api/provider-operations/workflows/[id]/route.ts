import { NextResponse } from 'next/server';

import { buildPortalApiHeaders } from '../../../../../lib/api-request';
import { config } from '../../../../../lib/server-runtime';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const headers = await buildPortalApiHeaders();

    const response = await fetch(
      `${config.serviceEndpoints.api}/api/provider/workflows/${encodeURIComponent(id)}`,
      {
        method: 'GET',
        headers,
        cache: 'no-store'
      }
    );

    const body = (await response.json().catch(() => null)) as Record<string, unknown> | null;

    return NextResponse.json(body ?? {}, {
      status: response.status,
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : 'Unable to load provider workflow action.'
      },
      { status: 503 }
    );
  }
}
