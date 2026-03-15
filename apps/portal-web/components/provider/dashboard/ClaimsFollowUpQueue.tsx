import { StatusBadge } from '../../portal-ui';

export interface ClaimsFollowUpItem {
  claimId: string;
  patientName: string;
  date: string;
  status: string;
  nextAction: string;
}

export function ClaimsFollowUpQueue({ items }: { items: ClaimsFollowUpItem[] }) {
  return (
    <section className="portal-card p-4">
      <h2 className="text-base font-semibold text-[var(--text-primary)]">Claims Follow-Up</h2>
      <div className="mt-3 space-y-1.5">
        {items.map((item) => (
          <article key={item.claimId} className="rounded-lg border border-[var(--border-subtle)] bg-slate-50 px-3 py-2">
            <div className="grid gap-2 md:grid-cols-[118px_1fr_96px_146px_1fr] md:items-center">
              <p className="text-xs font-semibold text-[var(--text-primary)]">{item.claimId}</p>
              <p className="text-xs text-[var(--text-secondary)]">{item.patientName}</p>
              <p className="text-xs text-[var(--text-secondary)]">{item.date}</p>
              <div>
                <StatusBadge label={item.status} />
              </div>
              <p className="text-xs text-[var(--text-secondary)]">{item.nextAction}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
