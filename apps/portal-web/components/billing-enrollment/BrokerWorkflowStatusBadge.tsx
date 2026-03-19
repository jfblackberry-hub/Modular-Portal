type Tone = 'default' | 'success' | 'warning' | 'danger' | 'info';

const toneClassByStatus: Record<string, Tone> = {
  Draft: 'default',
  'Census Needed': 'warning',
  'In Review': 'info',
  'Proposal Ready': 'success',
  Presented: 'info',
  Sold: 'success',
  'Closed Lost': 'danger',
  'Not Started': 'default',
  'Awaiting Rates': 'warning',
  'Employer Review': 'info',
  'Decision Pending': 'warning',
  Accepted: 'success',
  Declined: 'danger'
};

const toneClasses: Record<Tone, string> = {
  default: 'bg-slate-100 text-slate-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-rose-50 text-rose-700',
  info: 'bg-sky-50 text-sky-700'
};

export function BrokerWorkflowStatusBadge({ status }: { status: string }) {
  const tone = toneClassByStatus[status] ?? 'default';

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-[12px] font-semibold ${toneClasses[tone]}`}
      aria-label={`Status: ${status}`}
    >
      {status}
    </span>
  );
}
