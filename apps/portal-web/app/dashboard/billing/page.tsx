import { PageHeader, SurfaceCard } from '../../../components/portal-ui';
import { formatCurrency } from '../../../lib/portal-format';

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Billing"
        title="Billing and payments"
        description="Review your premium balance, payment due date, and available payment methods."
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <SurfaceCard title="Current balance">
          <p className="text-3xl font-semibold text-[var(--text-primary)]">
            {formatCurrency(184.22)}
          </p>
        </SurfaceCard>
        <SurfaceCard title="Due date">
          <p className="text-3xl font-semibold text-[var(--text-primary)]">Apr 1, 2026</p>
        </SurfaceCard>
        <SurfaceCard title="Payment method">
          <p className="text-3xl font-semibold text-[var(--text-primary)]">Visa ending 2048</p>
        </SurfaceCard>
      </div>

      <SurfaceCard
        title="Make a payment"
        description="A payer-style billing flow keeps the next payment action clear and above the fold."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <input className="portal-input px-4 py-3 text-sm outline-none" value={formatCurrency(184.22)} readOnly aria-label="Payment amount" />
          <select className="portal-input px-4 py-3 text-sm outline-none" aria-label="Select payment method">
            <option>Visa ending 2048</option>
            <option>Bank account ending 2901</option>
          </select>
        </div>
        <button className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-5 py-3 text-sm font-semibold text-white">
          Submit payment
        </button>
      </SurfaceCard>
    </div>
  );
}
