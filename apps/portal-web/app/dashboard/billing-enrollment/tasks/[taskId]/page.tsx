import { notFound } from 'next/navigation';

import { EmployerTaskDetailView } from '../../../../../components/billing-enrollment/EmployerTaskDetailView';
import { getEmployerTaskById } from '../../../../../lib/billing-enrollment-api';
import { getPortalSessionUser } from '../../../../../lib/portal-session';

export default async function EmployerTaskDetailPage({
  params
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  const sessionUser = await getPortalSessionUser();
  const task = sessionUser ? await getEmployerTaskById(sessionUser.id, taskId) : null;

  if (!task) {
    notFound();
  }

  return <EmployerTaskDetailView task={task} />;
}
