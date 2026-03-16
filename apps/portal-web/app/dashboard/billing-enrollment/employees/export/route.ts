import { NextResponse } from 'next/server';

import { getEmployerEmployees } from '../../../../../lib/billing-enrollment-api';
import { getPortalSessionUser } from '../../../../../lib/portal-session';

function asCsv(rows: string[][]) {
  return rows
    .map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(','))
    .join('\n');
}

export async function GET() {
  const user = await getPortalSessionUser();

  if (!user) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  const { employees } = await getEmployerEmployees(user.id);
  const rows = [
    [
      'Employee Name',
      'Employee ID',
      'Status',
      'Coverage Status',
      'Coverage Type',
      'Plan Selection',
      'Dependents Count',
      'Effective Date',
      'Termination Date',
      'Department'
    ],
    ...employees.map((employee) => [
      `${employee.firstName} ${employee.lastName}`,
      employee.employeeId,
      employee.status,
      employee.coverageStatus,
      employee.coverageType,
      employee.planSelection,
      String(employee.dependents.length),
      employee.effectiveDate,
      employee.terminationDate ?? '',
      employee.department
    ])
  ];

  return new NextResponse(asCsv(rows), {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="employee-census.csv"'
    }
  });
}
