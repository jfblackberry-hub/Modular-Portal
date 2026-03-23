import { NextResponse } from 'next/server';

import { getAdminReadiness } from '../../lib/deployment-probes';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const result = await getAdminReadiness();

  return NextResponse.json(result.response, {
    status: result.ready ? 200 : 503
  });
}
