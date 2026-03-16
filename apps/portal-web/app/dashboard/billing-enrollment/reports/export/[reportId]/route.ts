import { NextResponse } from 'next/server';

import {
  reportDefinitions,
  reportResultToCsv,
  reportResultToExcelCsv,
  reportResultToPdfText,
  runReportForTenant,
  type ReportFormat,
  type ReportId
} from '../../../../../../lib/reports-analytics-data';
import { getPortalSessionUser } from '../../../../../../lib/portal-session';

const reportIdSet = new Set(reportDefinitions.map((report) => report.id));

export async function GET(
  request: Request,
  context: { params: Promise<{ reportId: string }> }
) {
  const user = await getPortalSessionUser();

  if (!user) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  const { reportId: reportIdRaw } = await context.params;

  if (!reportIdSet.has(reportIdRaw as ReportId)) {
    return NextResponse.json({ message: 'Report not found.' }, { status: 404 });
  }

  const reportId = reportIdRaw as ReportId;
  const url = new URL(request.url);
  const format = (url.searchParams.get('format') ?? 'csv') as ReportFormat;
  const definition = reportDefinitions.find((report) => report.id === reportId);

  if (!definition) {
    return NextResponse.json({ message: 'Report not found.' }, { status: 404 });
  }

  const result = runReportForTenant(user.tenant.id, reportId, {
    dateRange: 'Last 30 Days',
    planType: 'All',
    coverageTier: 'All',
    employeeStatus: 'All',
    department: 'All',
    enrollmentStatus: 'All'
  });

  if (result.rows.length === 0) {
    return NextResponse.json({ message: 'No data for selected filters.' }, { status: 404 });
  }

  if (format === 'excel') {
    return new NextResponse(reportResultToExcelCsv(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.ms-excel',
        'Content-Disposition': `attachment; filename="${definition.id}.xls"`
      }
    });
  }

  if (format === 'pdf') {
    return new NextResponse(
      reportResultToPdfText(definition.name, result, user.tenant.name),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${definition.id}.pdf"`
        }
      }
    );
  }

  return new NextResponse(reportResultToCsv(result), {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${definition.id}.csv"`
    }
  });
}
