import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

import { getProviderOperationsDashboardSnapshot } from '../../../../../lib/provider-operations-snapshot';
import type { ResourceCalendarMoveRequest } from '../../../../../lib/provider-resource-calendar';
import { getProviderResourceCalendarWeeks,moveProviderResourceCalendarBooking } from '../../../../../lib/provider-resource-calendar-store';

function findRequestedResource(resourceId: string, dashboard: Awaited<ReturnType<typeof getProviderOperationsDashboardSnapshot>>['dashboard']) {
  return dashboard.utilization.therapists.find((row) => row.id === resourceId) ?? null;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ resourceId: string }> }
) {
  try {
    const { resourceId } = await context.params;
    const { dashboard, user } = await getProviderOperationsDashboardSnapshot();
    const resource = findRequestedResource(resourceId, dashboard);

    if (!resource) {
      return NextResponse.json({ message: 'Resource not found.' }, { status: 404 });
    }

    const weeks = await getProviderResourceCalendarWeeks({
      user,
      resource
    });

    return NextResponse.json(
      {
        resourceId,
        weeks
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store'
        }
      }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to load provider availability.';

    return NextResponse.json({ message }, { status: 401 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ resourceId: string }> }
) {
  try {
    const { resourceId } = await context.params;
    const { dashboard, user } = await getProviderOperationsDashboardSnapshot();
    const resource = findRequestedResource(resourceId, dashboard);

    if (!resource) {
      return NextResponse.json({ message: 'Resource not found.' }, { status: 404 });
    }

    const payload = (await request.json()) as Partial<ResourceCalendarMoveRequest>;

    if (
      !payload.sourceDate ||
      !payload.sourceLabel ||
      !payload.targetDate ||
      !payload.targetLabel
    ) {
      return NextResponse.json(
        { message: 'A source and target slot are required.' },
        { status: 400 }
      );
    }

    const weeks = await moveProviderResourceCalendarBooking({
      user,
      resource,
      move: {
        sourceDate: payload.sourceDate,
        sourceLabel: payload.sourceLabel,
        targetDate: payload.targetDate,
        targetLabel: payload.targetLabel
      }
    });

    return NextResponse.json(
      {
        resourceId,
        weeks
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store'
        }
      }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to move the scheduled session.';

    return NextResponse.json({ message }, { status: 400 });
  }
}
