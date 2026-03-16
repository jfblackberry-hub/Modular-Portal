'use client';

import { useMemo, useState } from 'react';

import type { EmployerBillingDataset, EmployerPaymentMethod } from '../../lib/employer-billing-data';
import { EmptyState, StatusBadge } from '../portal-ui';

const paymentMethods: EmployerPaymentMethod[] = [
  'ACH Bank Transfer',
  'Credit Card',
  'Wire Transfer'
];

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

export function EmployerPaymentManagement({ dataset }: { dataset: EmployerBillingDataset }) {
  const currentInvoice = dataset.invoices[0];
  const [selectedMethod, setSelectedMethod] = useState<EmployerPaymentMethod>('ACH Bank Transfer');
  const [amount, setAmount] = useState(currentInvoice ? String(currentInvoice.outstandingBalance || currentInvoice.invoiceAmount) : '');
  const [confirmation, setConfirmation] = useState('');
  const [status, setStatus] = useState<'idle' | 'processing' | 'succeeded'>('idle');

  const paymentStatusLabel = useMemo(() => {
    if (status === 'processing') {
      return 'Processing';
    }
    if (status === 'succeeded') {
      return 'Completed';
    }
    return 'Ready';
  }, [status]);

  if (!currentInvoice) {
    return (
      <div className="space-y-5">
        <section className="portal-card p-6 sm:p-8">
          <p className="text-[13px] font-medium text-[var(--tenant-primary-color)]">Billing &amp; Payments</p>
          <h1 className="mt-2 text-[28px] font-semibold leading-tight text-[var(--text-primary)] sm:text-[32px]">Payment Management</h1>
        </section>
        <EmptyState title="No invoice available" description="A current invoice is required to submit one-time payments." />
      </div>
    );
  }

  function submitPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('processing');
    setConfirmation('');

    setTimeout(() => {
      setStatus('succeeded');
      setConfirmation(`Payment of ${formatCurrency(Number(amount || '0'))} submitted via ${selectedMethod}. Confirmation ID PMT-${Date.now().toString().slice(-6)}.`);
    }, 700);
  }

  return (
    <div className="space-y-5">
      <section className="portal-card p-6 sm:p-8">
        <p className="text-[13px] font-medium text-[var(--tenant-primary-color)]">Billing &amp; Payments</p>
        <h1 className="mt-2 text-[28px] font-semibold leading-tight text-[var(--text-primary)] sm:text-[32px]">Payment Management</h1>
        <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[var(--text-secondary)]">Submit one-time payments, choose payment methods, and track payment status.</p>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="portal-card p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">One-Time Payment</h2>
          <form className="mt-4 space-y-3" onSubmit={submitPayment}>
            <label className="block text-sm font-medium text-[var(--text-primary)]">
              Invoice
              <input value={currentInvoice.invoiceNumber} disabled className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] bg-slate-100 px-3 text-sm" />
            </label>
            <label className="block text-sm font-medium text-[var(--text-primary)]">
              Payment Method
              <select value={selectedMethod} onChange={(event) => setSelectedMethod(event.target.value as EmployerPaymentMethod)} className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm">
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-[var(--text-primary)]">
              Amount
              <input type="number" min="0" value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm" />
            </label>
            <button type="submit" disabled={status === 'processing'} className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-70">
              {status === 'processing' ? 'Submitting Payment...' : 'Submit Payment'}
            </button>
          </form>

          {confirmation ? (
            <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{confirmation}</div>
          ) : null}
        </article>

        <article className="portal-card p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Payment Status Tracking</h2>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">Current Invoice</p>
              <p className="mt-1 font-semibold text-[var(--text-primary)]">{currentInvoice.invoiceNumber}</p>
              <p className="text-sm text-[var(--text-secondary)]">Due {formatDate(currentInvoice.dueDate)}</p>
            </div>
            <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">Outstanding Balance</p>
              <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{formatCurrency(currentInvoice.outstandingBalance)}</p>
            </div>
            <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">Current Payment Status</p>
              <div className="mt-2"><StatusBadge label={paymentStatusLabel} /></div>
            </div>
            <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3 text-sm text-[var(--text-secondary)]">
              Mock status timeline:
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Submitted</li>
                <li>Gateway processing</li>
                <li>Posted to invoice</li>
              </ul>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
