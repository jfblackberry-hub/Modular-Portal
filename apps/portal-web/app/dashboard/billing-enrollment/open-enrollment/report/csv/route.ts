import { NextResponse } from 'next/server';

import { getOpenEnrollmentRecordsForTenant } from '../../../../../../lib/open-enrollment-data';
import { getPortalSessionUser } from '../../../../../../lib/portal-session';

function toCsv(rows: string[][]) {
  return rows
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
    .join('\n');
}

export async function GET() {
  const user = await getPortalSessionUser();

  if (!user) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  const rows = [
    [
      'Employee Name',
      'Employee ID',
      'Department',
      'Enrollment Status',
      'Selected Plan',
      'Coverage Tier',
      'Submission Date',
      'Last Reminder Sent'
    ]
  ];

  for (const record of getOpenEnrollmentRecordsForTenant(user.tenant.id)) {
    rows.push([
      record.employeeName,
      record.employeeId,
      record.department,
      record.enrollmentStatus,
      record.selectedPlan,
      record.coverageTier,
      record.submissionDate ?? '',
      record.lastReminderSent ?? ''
    ]);
  }

  return new NextResponse(toCsv(rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="open-enrollment-report.csv"'
    }
  });
}
