import { formatCurrency } from '../../lib/portal-format';
import { IDCardPreview } from '../member/id-card-preview';

function ProgressBar({
  current,
  label,
  total
}: {
  current: number;
  label: string;
  total: number;
}) {
  const percentage = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
        <p className="text-sm font-semibold text-[var(--tenant-primary-color)]">{percentage}%</p>
      </div>
      <div className="h-3 rounded-full bg-slate-100">
        <div
          className="h-3 rounded-full"
          style={{
            width: `${percentage}%`,
            backgroundColor: 'var(--tenant-primary-color)'
          }}
        />
      </div>
      <p className="text-sm text-[var(--text-secondary)]">
        {formatCurrency(current)} of {formatCurrency(total)}
      </p>
    </div>
  );
}

export function MyPlanSection({
  coverageStatus,
  deductibleCurrent,
  deductibleTotal,
  groupNumber,
  memberId,
  memberName,
  outOfPocketCurrent,
  outOfPocketTotal,
  planName
}: {
  coverageStatus: string;
  deductibleCurrent: number;
  deductibleTotal: number;
  groupNumber: string;
  memberId: string;
  memberName: string;
  outOfPocketCurrent: number;
  outOfPocketTotal: number;
  planName: string;
}) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm" aria-label="My Plan">
      <h2 className="text-2xl font-bold text-[var(--text-primary)]">My Plan</h2>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        {planName} <span className="mx-2 text-[var(--text-muted)]">•</span> {coverageStatus}
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <ProgressBar label="Deductible progress" current={deductibleCurrent} total={deductibleTotal} />
        <ProgressBar
          label="Out-of-pocket progress"
          current={outOfPocketCurrent}
          total={outOfPocketTotal}
        />
      </div>

      <IDCardPreview
        planName={planName}
        memberName={memberName}
        memberId={memberId}
        groupNumber={groupNumber}
        enableQrCode
        enableWalletIntegration
        enableDownloadPdf
      />
    </section>
  );
}
