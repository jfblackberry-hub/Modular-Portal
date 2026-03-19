import { NextResponse } from 'next/server';

import { getEstimatorBootstrap } from '../../../../lib/care-cost-estimator/service';
import { getPortalSessionUser } from '../../../../lib/portal-session';

export async function GET() {
  const user = await getPortalSessionUser();
  return NextResponse.json(getEstimatorBootstrap(user));
}
