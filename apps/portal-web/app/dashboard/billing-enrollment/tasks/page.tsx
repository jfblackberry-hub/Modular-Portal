import { EmployerTasksDashboard } from '../../../../components/billing-enrollment/EmployerTasksDashboard';
import { getEmployerTasks } from '../../../../lib/billing-enrollment-api';
import { getPortalSessionUser } from '../../../../lib/portal-session';

export default async function EmployerTasksPage() {
  const sessionUser = await getPortalSessionUser();
  const payload = sessionUser ? await getEmployerTasks(sessionUser.id) : null;

  return (
    <EmployerTasksDashboard
      tasks={payload?.tasks ?? []}
      taskTypes={payload?.filters.taskTypes ?? []}
      priorities={payload?.filters.priorities ?? []}
      statuses={payload?.filters.statuses ?? []}
      modules={payload?.filters.modules ?? []}
    />
  );
}
