import { NextResponse } from 'next/server';

import type { ProviderWorkflowActionRequest } from '@payer-portal/api-contracts';

import { buildPortalApiHeaders } from '../../../../lib/api-request';
import { config } from '../../../../lib/server-runtime';

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ProviderWorkflowActionRequest;
    const headers = await buildPortalApiHeaders({
      'Content-Type': 'application/json'
    });

    const response = await fetch(`${config.serviceEndpoints.api}/api/provider/workflows`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      cache: 'no-store'
    });

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
            : 'Unable to submit provider workflow action.'
      },
      { status: 503 }
    );
  }
}
