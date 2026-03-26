import { NextResponse } from 'next/server';

import { getProviderOperationsDashboardSnapshot } from '../../../../lib/provider-operations-snapshot';

export async function GET() {
  try {
    const { dashboard } = await getProviderOperationsDashboardSnapshot();

    return NextResponse.json(dashboard, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to load provider operations dashboard.';

    return NextResponse.json({ message }, { status: 401 });
  }
}
