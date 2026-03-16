import Link from 'next/link';

import type { EmployerBillingDataset, EmployerInvoiceLineItem } from '../../lib/employer-billing-data';
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

function lineItemTotal(lineItems: EmployerInvoiceLineItem[], category: EmployerInvoiceLineItem['category']) {
  return lineItems
    .filter((lineItem) => lineItem.category === category)
    .reduce((total, lineItem) => total + lineItem.amount, 0);
}

export function EmployerBillingOverview({ dataset }: { dataset: EmployerBillingDataset }) {
  const currentInvoice = dataset.invoices[0];

  if (!currentInvoice) {
    return (
      <div className="space-y-5">
        <section className="portal-card p-6 sm:p-8">
          <p className="text-[13px] font-medium text-[var(--tenant-primary-color)]">Billing &amp; Payments</p>
          <h1 className="mt-2 text-[28px] font-semibold leading-tight text-[var(--text-primary)] sm:text-[32px]">
            Billing Overview
          </h1>
        </section>
        <EmptyState
          title="No invoices generated yet"
          description="Invoices and billing summaries appear once the first billing cycle is generated."
        />
      </div>
    );
  }

  const previousPaymentsApplied = dataset.payments
    .filter((payment) => payment.invoiceId === currentInvoice.id)
    .reduce((total, payment) => total + payment.amount, 0);

  const categories: Array<EmployerInvoiceLineItem['category']> = [
    'Employee Premiums',
    'Dependent Premiums',
    'Employer Contribution',
    'Employee Contribution',
    'Adjustments',
    'Credits'
  ];

  return (
    <div className="space-y-5">
      <section className="portal-card p-6 sm:p-8">
        <p className="text-[13px] font-medium text-[var(--tenant-primary-color)]">Billing &amp; Payments</p>
        <h1 className="mt-2 text-[28px] font-semibold leading-tight text-[var(--text-primary)] sm:text-[32px]">
          Billing Overview
        </h1>
        <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[var(--text-secondary)]">
          Review current invoice, payment status, and billing breakdown for {dataset.employerName}.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/dashboard/billing-enrollment/billing-payments" className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-5 py-3 text-sm font-semibold text-white">
            Pay Invoice
          </Link>
          <Link href="/dashboard/billing-enrollment/billing-invoices/history" className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] bg-white px-5 py-3 text-sm font-semibold text-[var(--tenant-primary-color)]">
            Invoice History
          </Link>
          <Link href={`/dashboard/billing-enrollment/billing-invoices/${currentInvoice.id}/download/pdf`} className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] bg-white px-5 py-3 text-sm font-semibold text-[var(--tenant-primary-color)]">
            Download Statement
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="portal-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Current Billing Cycle</p>
          <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{dataset.currentBillingCycle}</p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Invoice {currentInvoice.invoiceNumber}</p>
        </article>
        <article className="portal-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Invoice Summary</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{formatCurrency(currentInvoice.invoiceAmount)}</p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Due {formatDate(currentInvoice.dueDate)}</p>
        </article>
        <article className="portal-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Payment Status</p>
          <div className="mt-2"><StatusBadge label={currentInvoice.paymentStatus} /></div>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Method: {currentInvoice.paymentMethod ?? 'Not selected'}</p>
        </article>
        <article className="portal-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Outstanding Balance</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{formatCurrency(currentInvoice.outstandingBalance)}</p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Previous payments applied: {formatCurrency(previousPaymentsApplied)}</p>
        </article>
      </section>

      <section className="portal-card p-5">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Billing Breakdown</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {categories.map((category) => (
            <article key={category} className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
              <p className="text-sm text-[var(--text-secondary)]">{category}</p>
              <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{formatCurrency(lineItemTotal(currentInvoice.lineItems, category))}</p>
            </article>
          ))}
          <article className="rounded-xl border border-[var(--tenant-primary-color)] bg-[var(--tenant-primary-soft-color)] px-4 py-3 sm:col-span-2 xl:col-span-4">
            <p className="text-sm text-[var(--text-secondary)]">Total Due</p>
            <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{formatCurrency(currentInvoice.outstandingBalance)}</p>
          </article>
        </div>
      </section>
    </div>
  );
}
