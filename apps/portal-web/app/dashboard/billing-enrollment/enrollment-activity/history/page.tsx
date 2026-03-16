import { EnrollmentActivityHistoryTable } from '../../../../../components/billing-enrollment/EnrollmentActivityHistoryTable';
import { getEmployerEnrollmentActivity } from '../../../../../lib/billing-enrollment-api';
import { getPortalSessionUser } from '../../../../../lib/portal-session';

export default async function EnrollmentHistoryPage() {
  const sessionUser = await getPortalSessionUser();
  const payload = sessionUser ? await getEmployerEnrollmentActivity(sessionUser.id) : null;

  return <EnrollmentActivityHistoryTable requests={payload?.history ?? []} />;
}
