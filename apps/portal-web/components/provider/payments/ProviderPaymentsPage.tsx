'use client';

import type {
  ProviderPortalConfig,
  ProviderPortalVariant
} from '../../../config/providerPortalConfig';
import { PageHeader, StatusBadge, SurfaceCard } from '../../portal-ui';

type PaymentRow = {
  remitId: string;
  paymentDate: string;
  paymentAmount: string;
  method: 'EFT' | 'Check';
  eftEra: string;
  status: 'Posted' | 'In Transit' | 'Pending';
};

const paymentRows: PaymentRow[] = [
  {
    remitId: 'REM-44501',
    paymentDate: '2026-03-14',
    paymentAmount: '$84,220.00',
    method: 'EFT',
    eftEra: 'ERA linked / EFT linked',
    status: 'Posted'
  },
  {
    remitId: 'REM-44477',
    paymentDate: '2026-03-12',
    paymentAmount: '$21,980.00',
    method: 'EFT',
    eftEra: 'ERA linked / EFT pending confirmation',
    status: 'In Transit'
  },
  {
    remitId: 'REM-44429',
    paymentDate: '2026-03-09',
    paymentAmount: '$10,540.00',
    method: 'Check',
    eftEra: 'ERA placeholder / Check remittance',
    status: 'Pending'
  }
];

export function ProviderPaymentsPage({
  config,
  variant,
  embedded = false
}: {
  config: ProviderPortalConfig;
  variant: ProviderPortalVariant;
  embedded?: boolean;
}) {
  const pageTitle = variant === 'medical' ? 'Payments Workspace' : config.routeContent.payments.title;

  return (
    <div className="space-y-6">
      {embedded ? null : (
        <PageHeader
          eyebrow={config.displayName}
          title={pageTitle}
          description="Track remittance and payment activity, monitor EFT/ERA status, and download payment artifacts."
        />
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="portal-card p-5">
          <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Remittance Summary</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">$116,740.00</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Total in current settlement cycle.</p>
        </article>
        <article className="portal-card p-5">
          <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Last Payment Date</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">2026-03-14</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Most recent posted payment.</p>
        </article>
        <article className="portal-card p-5">
          <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Payment Method Mix</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">EFT 67% / Check 33%</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Current cycle method mix.</p>
        </article>
        <article className="portal-card p-5">
          <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">EFT / ERA Status</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">2 linked / 1 pending</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Placeholder enrollment and linkage status.</p>
        </article>
      </section>

      <SurfaceCard title="Payments and Remittance" description="Review payment date, amount, method, EFT/ERA mapping, and downloadable remittance files.">
        <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)]">
          <table className="portal-data-table w-full border-collapse bg-white text-sm">
            <thead>
              <tr className="text-left text-[var(--text-muted)]">
                <th className="px-4 py-3 font-medium">Remittance ID</th>
                <th className="px-4 py-3 font-medium">Payment Date</th>
                <th className="px-4 py-3 font-medium">Payment Amount</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">EFT / ERA</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Download</th>
              </tr>
            </thead>
            <tbody>
              {paymentRows.map((payment) => (
                <tr key={payment.remitId} className="border-t border-[var(--border-subtle)]">
                  <td className="px-4 py-3 text-[var(--text-primary)]">{payment.remitId}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{payment.paymentDate}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{payment.paymentAmount}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{payment.method}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{payment.eftEra}</td>
                  <td className="px-4 py-3"><StatusBadge label={payment.status} /></td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="inline-flex min-h-9 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] px-3 py-1.5 text-xs font-semibold text-[var(--tenant-primary-color)]"
                    >
                      Download Remittance
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SurfaceCard>

      <SurfaceCard title="Related Actions" description="Start common payment follow-up activities.">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] px-4 py-2 text-sm font-semibold text-[var(--tenant-primary-color)]"
          >
            File Dispute
          </button>
          <button
            type="button"
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] px-4 py-2 text-sm font-semibold text-[var(--tenant-primary-color)]"
          >
            Start Appeal
          </button>
          <button
            type="button"
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-4 py-2 text-sm font-semibold text-white"
          >
            Download Remittance
          </button>
        </div>
      </SurfaceCard>
    </div>
  );
}
