import { EmployerNotificationsCenter } from '../../../../components/billing-enrollment/EmployerNotificationsCenter';
import { getEmployerNotifications } from '../../../../lib/billing-enrollment-api';
import { getPortalSessionUser } from '../../../../lib/portal-session';

export default async function EmployerNotificationsPage() {
  const sessionUser = await getPortalSessionUser();
  const payload = sessionUser ? await getEmployerNotifications(sessionUser.id) : null;

  return <EmployerNotificationsCenter notifications={payload?.notifications ?? []} />;
}
