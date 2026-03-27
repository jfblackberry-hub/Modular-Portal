import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getProviderOperationsDashboardSnapshot } from '../../../lib/provider-operations-snapshot';
import {
  createDefaultProviderReportingFilters,
  type ProviderReportingFilters
} from '../../../lib/provider-reporting';
import {
  getProviderReportingStaticOptionsFromWarehouse,
  getProviderReportingWarehouseSummary,
  runProviderReport
} from '../../../lib/provider-reporting-service';

function sanitizeFilters(payload: Partial<ProviderReportingFilters> | null | undefined): ProviderReportingFilters {
  const defaults = createDefaultProviderReportingFilters();

  return {
    ...defaults,
    ...payload
  };
}

export async function GET() {
  try {
    await getProviderOperationsDashboardSnapshot();

    const filters = createDefaultProviderReportingFilters();

    return NextResponse.json(
      {
        options: getProviderReportingStaticOptionsFromWarehouse(),
        report: runProviderReport(filters),
        summary: getProviderReportingWarehouseSummary()
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
      error instanceof Error ? error.message : 'Unable to load provider reporting workspace.';

    return NextResponse.json({ message }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await getProviderOperationsDashboardSnapshot();

    const payload = (await request.json()) as Partial<ProviderReportingFilters> | undefined;
    const filters = sanitizeFilters(payload);

    return NextResponse.json(
      {
        options: getProviderReportingStaticOptionsFromWarehouse(),
        report: runProviderReport(filters),
        summary: getProviderReportingWarehouseSummary()
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
      error instanceof Error ? error.message : 'Unable to run provider report.';

    return NextResponse.json({ message }, { status: 400 });
  }
}
