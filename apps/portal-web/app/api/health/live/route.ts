import { NextResponse } from 'next/server';

import { getPortalLiveness } from '../../../../lib/deployment-probes';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json(getPortalLiveness(), { status: 200 });
}
