import { NextResponse } from 'next/server';

import { getAdminLiveness } from '../../lib/deployment-probes';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json(getAdminLiveness(), { status: 200 });
}
