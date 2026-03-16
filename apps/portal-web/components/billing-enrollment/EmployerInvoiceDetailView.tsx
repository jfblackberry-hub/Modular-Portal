import Link from 'next/link';

import type { EmployerInvoiceRecord, EmployerPaymentRecord } from '../../lib/employer-billing-data';
import { EmptyState, StatusBadge } from '../portal-ui';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
}

function formatDate(value?: string) {
  if (!value) {
    return '—';
  }

  return new Date(`${value}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function EmployerInvoiceDetailView({
  invoice,
  payments
}: {
  invoice: EmployerInvoiceRecord;
  payments: EmployerPaymentRecord[];
}) {
  const invoicePayments = payments.filter((payment) => payment.invoiceId === invoice.id);

  return (
    <div className="space-y-5">
      <section className="portal-card p-6 sm:p-8">
        <p className="text-[13px] font-medium text-[var(--tenant-primary-color)]">Invoice Detail</p>
        <h1 className="mt-2 text-[28px] font-semibold leading-tight text-[var(--text-primary)] sm:text-[32px]">
          {invoice.invoiceNumber}
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">{invoice.billingCycleLabel}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/dashboard/billing-enrollment/billing-overview" className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-white px-4 py-2 text-sm font-semibold text-[var(--text-secondary)]">Back to Billing Overview</Link>
          <Link href={`/dashboard/billing-enrollment/billing-invoices/${invoice.id}/download/pdf`} className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] bg-white px-4 py-2 text-sm font-semibold text-[var(--tenant-primary-color)]">Download PDF</Link>
          <Link href={`/dashboard/billing-enrollment/billing-invoices/${invoice.id}/download/csv`} className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] bg-white px-4 py-2 text-sm font-semibold text-[var(--tenant-primary-color)]">Download CSV</Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="portal-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Invoice Number</p>
          <p className="mt-2 font-semibold text-[var(--text-primary)]">{invoice.invoiceNumber}</p>
        </article>
        <article className="portal-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Billing Period</p>
          <p className="mt-2 font-semibold text-[var(--text-primary)]">{invoice.billingPeriod}</p>
        </article>
        <article className="portal-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Due Date</p>
          <p className="mt-2 font-semibold text-[var(--text-primary)]">{formatDate(invoice.dueDate)}</p>
        </article>
        <article className="portal-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Status</p>
          <div className="mt-2"><StatusBadge label={invoice.status} /></div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="portal-card p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Employer Information</h2>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">{invoice.employerName}</p>
          <p className="text-sm text-[var(--text-secondary)]">{invoice.employerAddress}</p>
        </article>

        <article className="portal-card p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Invoice Totals</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[var(--text-secondary)]">Invoice Amount</dt>
              <dd className="font-semibold text-[var(--text-primary)]">{formatCurrency(invoice.invoiceAmount)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[var(--text-secondary)]">Outstanding Balance</dt>
              <dd className="font-semibold text-[var(--text-primary)]">{formatCurrency(invoice.outstandingBalance)}</dd>
            </div>
          </dl>
        </article>
      </section>

      <section className="portal-card p-5">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Line Item Breakdown</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="portal-data-table w-full border-collapse bg-white text-sm">
            <thead>
              <tr>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((lineItem) => (
                <tr key={lineItem.id}>
                  <td>{lineItem.category}</td>
                  <td>{lineItem.description}</td>
                  <td>{formatCurrency(lineItem.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="payment-history" className="grid gap-4 xl:grid-cols-2">
        <article className="portal-card p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Payment History</h2>
          {invoicePayments.length === 0 ? (
            <div className="mt-4"><EmptyState title="No payment history" description="No payment records are tied to this invoice yet." /></div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="portal-data-table w-full border-collapse bg-white text-sm">
                <thead>
                  <tr>
                    <th>Payment ID</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoicePayments.map((payment) => (
                    <tr key={payment.id}>
                      <td>{payment.id}</td>
                      <td>{formatCurrency(payment.amount)}</td>
                      <td>{payment.method}</td>
                      <td>{formatDate(payment.paymentDate)}</td>
                      <td><StatusBadge label={payment.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="portal-card p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Adjustments & Credits</h2>
          <div className="mt-4 space-y-3">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Adjustments</p>
              {invoice.adjustments.length === 0 ? (
                <p className="mt-1 text-sm text-[var(--text-secondary)]">No adjustments.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {invoice.adjustments.map((adjustment) => (
                    <li key={adjustment.id} className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-3 py-2 text-sm">
                      <p className="font-medium text-[var(--text-primary)]">{adjustment.description}</p>
                      <p className="text-[var(--text-secondary)]">{formatDate(adjustment.appliedDate)} • {formatCurrency(adjustment.amount)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Credits Applied</p>
              {invoice.credits.length === 0 ? (
                <p className="mt-1 text-sm text-[var(--text-secondary)]">No credits applied.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {invoice.credits.map((credit) => (
                    <li key={credit.id} className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-3 py-2 text-sm">
                      <p className="font-medium text-[var(--text-primary)]">{credit.description}</p>
                      <p className="text-[var(--text-secondary)]">{formatDate(credit.appliedDate)} • {formatCurrency(-credit.amount)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
