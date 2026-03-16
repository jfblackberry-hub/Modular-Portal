import { EmployeeCensusList } from '../../../../components/billing-enrollment/EmployeeCensusList';
import { getEmployerEmployees } from '../../../../lib/billing-enrollment-api';
import { getPortalSessionUser } from '../../../../lib/portal-session';

export default async function EmployeeCensusPage() {
  const sessionUser = await getPortalSessionUser();
  const employerName = sessionUser?.tenant.name ?? 'Employer';

  const payload = sessionUser ? await getEmployerEmployees(sessionUser.id) : null;

  return (
    <EmployeeCensusList
      employees={payload?.employees ?? []}
      employerName={employerName}
      summary={
        payload?.summary ?? {
          eligibleEmployees: 0,
          enrolledEmployees: 0,
          waivedEmployees: 0,
          dependentsCovered: 0,
          coveredLives: 0,
          coverageRate: 0
        }
      }
      coverageTypes={payload?.filters.coverageTypes ?? []}
      plans={payload?.filters.plans ?? []}
      departments={payload?.filters.departments ?? []}
    />
  );
}
