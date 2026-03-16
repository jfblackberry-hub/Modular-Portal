import { EmployerNotificationSettings } from '../../../../../components/billing-enrollment/EmployerNotificationSettings';
import { getEmployerNotificationPreferences } from '../../../../../lib/billing-enrollment-api';
import { getPortalSessionUser } from '../../../../../lib/portal-session';

export default async function EmployerNotificationSettingsPage() {
  const sessionUser = await getPortalSessionUser();
  const preferences = sessionUser ? await getEmployerNotificationPreferences(sessionUser.id) : null;

  return (
    <EmployerNotificationSettings
      initialPreferences={
        preferences ?? {
          portalNotifications: true,
          emailNotifications: true,
          smsNotifications: false,
          categories: {
            Enrollment: true,
            Billing: true,
            Compliance: true,
            Documents: true,
            System: true
          }
        }
      }
    />
  );
}
