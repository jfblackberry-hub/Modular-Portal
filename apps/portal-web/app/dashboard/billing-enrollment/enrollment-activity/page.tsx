import { EnrollmentActivityPendingList } from '../../../../components/billing-enrollment/EnrollmentActivityPendingList';
import { getEmployerEnrollmentActivity } from '../../../../lib/billing-enrollment-api';
import { getPortalSessionUser } from '../../../../lib/portal-session';

export default async function EnrollmentActivityPage() {
  const sessionUser = await getPortalSessionUser();
  const payload = sessionUser ? await getEmployerEnrollmentActivity(sessionUser.id) : null;

  return (
    <EnrollmentActivityPendingList
      requests={payload?.pending ?? []}
      requestTypes={payload?.filters.requestTypes ?? []}
      plans={payload?.filters.plans ?? []}
      departments={payload?.filters.departments ?? []}
    />
  );
}
