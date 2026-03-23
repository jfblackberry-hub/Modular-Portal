import { NextResponse } from 'next/server';

import { createMockPdfBuffer } from '../../../../../../lib/mock-pdf';
import { getPortalSessionUser } from '../../../../../../lib/portal-session';
import {
  reportDefinitions,
  type ReportFormat,
  type ReportId,
  reportResultToCsv,
  reportResultToExcelCsv,
  reportResultToPdfText,
  runReportForTenant} from '../../../../../../lib/reports-analytics-data';

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
    const pdfText = reportResultToPdfText(definition.name, result, user.tenant.name);
    return new NextResponse(
      createMockPdfBuffer(definition.name, pdfText.split('\n')),
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
