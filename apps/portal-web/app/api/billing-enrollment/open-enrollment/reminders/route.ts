import { NextResponse } from 'next/server';

import {
  getOpenEnrollmentRecordsForTenant,
  getPendingReminderTargets
} from '../../../../../lib/open-enrollment-data';
import { getPortalSessionUser } from '../../../../../lib/portal-session';

type ReminderRequestBody = {
  channel?: 'email' | 'portal';
  mode?: 'pending' | 'single';
  recordIds?: string[];
};

export async function POST(request: Request) {
  const user = await getPortalSessionUser();

  if (!user) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  const body = (await request.json()) as ReminderRequestBody;
  const channel = body.channel ?? 'email';
  const mode = body.mode ?? 'pending';

  if (channel !== 'email' && channel !== 'portal') {
    return NextResponse.json(
      { message: 'Invalid reminder channel.' },
      { status: 400 }
    );
  }

  const tenantId = user.tenant.id;
  const records = getOpenEnrollmentRecordsForTenant(tenantId);
  const pending = getPendingReminderTargets(records);

  const targets = mode === 'single'
    ? pending.filter((record) => (body.recordIds ?? []).includes(record.id))
    : pending;

  if (targets.length === 0) {
    return NextResponse.json(
      {
        message: 'No pending employees found for reminder delivery.',
        delivered: 0,
        failed: 0
      },
      { status: 400 }
    );
  }

  const failed = targets.filter((record) => record.reminderFailures > 0).length;
  const delivered = Math.max(0, targets.length - failed);

  return NextResponse.json({
    message: `${channel === 'email' ? 'Email' : 'Portal'} reminders queued for ${targets.length} employee${targets.length === 1 ? '' : 's'}`,
    delivered,
    failed
  });
}
