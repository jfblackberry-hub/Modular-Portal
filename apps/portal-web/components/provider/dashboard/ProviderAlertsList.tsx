import { StatusBadge } from '../../portal-ui';

export interface ProviderAlertItem {
  id: string;
  type: 'warning' | 'success' | 'info' | 'maintenance';
  message: string;
  status: string;
  date: string;
}

export interface ProviderNoticeItem {
  id: string;
  title: string;
  message: string;
  date: string;
}

const typeLabel: Record<ProviderAlertItem['type'], string> = {
  warning: 'Warning',
  success: 'Success',
  info: 'Info',
  maintenance: 'Maintenance'
};

export function ProviderAlertsList({
  alerts,
  notices
}: {
  alerts: ProviderAlertItem[];
  notices: ProviderNoticeItem[];
}) {
  return (
    <div className="space-y-3">
      <section className="portal-card p-4">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Alerts and Announcements</h2>
        <ul className="mt-3 space-y-1.5">
          {alerts.map((alert) => (
            <li key={alert.id} className="rounded-lg border border-[var(--border-subtle)] bg-slate-50 px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  {typeLabel[alert.type]}
                </p>
                <StatusBadge label={alert.status} />
              </div>
              <p className="mt-1 text-sm text-[var(--text-primary)]">{alert.message}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">{alert.date}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="portal-card p-4">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Maintenance / System Notices</h2>
        <ul className="mt-3 space-y-1.5">
          {notices.map((notice) => (
            <li key={notice.id} className="rounded-lg border border-[var(--border-subtle)] bg-slate-50 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{notice.title}</p>
              <p className="mt-1 text-sm text-[var(--text-primary)]">{notice.message}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">{notice.date}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
