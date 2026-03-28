import { NextResponse } from 'next/server';

import { config } from '../../../../../lib/server-runtime';

export async function GET() {
  try {
    const response = await fetch(`${config.serviceEndpoints.auth}/auth/login/catalog`, {
      method: 'GET',
      cache: 'no-store'
    });

    const payload = (await response.json()) as Record<string, unknown>;
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json(
      { message: 'Local API unavailable. Start the API service and try again.' },
      { status: 503 }
    );
  }
}
