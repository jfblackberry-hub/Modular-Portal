'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import type { BillingSummaryResponse } from '../../lib/billing-enrollment-api';
import { EmptyState, StatusBadge } from '../portal-ui';

type BillingView =
  | 'current-balance'
  | 'next-invoice'
  | 'invoice-detail'
  | 'payment-history'
  | 'make-payment'
  | 'payment-methods'
  | 'autopay'
  | 'statements';

type InvoiceDetailResponse = {
  invoice: BillingSummaryResponse['nextInvoice'];
  timeline: Array<{ label: string; date: string; status: string }>;
};

const navItems: Array<{ view: BillingView; label: string; href: string }> = [
  { view: 'current-balance', label: 'Current Balance', href: '/dashboard/billing-enrollment/payments' },
  { view: 'next-invoice', label: 'Next Invoice', href: '/dashboard/billing-enrollment/payments/next-invoice' },
  { view: 'invoice-detail', label: 'Invoice Detail', href: '/dashboard/billing-enrollment/payments/invoice/inv-2026-04' },
  { view: 'payment-history', label: 'Payment History', href: '/dashboard/billing-enrollment/payments/history' },
  { view: 'make-payment', label: 'Make a Payment', href: '/dashboard/billing-enrollment/payments/make' },
  { view: 'payment-methods', label: 'Saved Methods', href: '/dashboard/billing-enrollment/payments/methods' },
  { view: 'autopay', label: 'Set Up Autopay', href: '/dashboard/billing-enrollment/payments/autopay' },
  { view: 'statements', label: 'Statements / Tax Docs', href: '/dashboard/billing-enrollment/payments/statements' }
];

function fmtCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function toneForStatus(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes('post') || normalized.includes('paid') || normalized.includes('success')) {
    return 'success';
  }
  if (normalized.includes('fail') || normalized.includes('past due') || normalized.includes('critical')) {
    return 'danger';
  }
  if (normalized.includes('due') || normalized.includes('pending') || normalized.includes('warning')) {
    return 'warning';
  }
  return 'info';
}

function DelinquencyBanner({ summary }: { summary: BillingSummaryResponse | null }) {
  if (!summary) {
    return null;
  }

  const { delinquency, gracePeriod } = summary;
  if (!delinquency.isDelinquent && !gracePeriod.active) {
    return (
      <section className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        Account in good standing. Next due date: {new Date(summary.nextInvoice.dueDate).toLocaleDateString()}.
      </section>
    );
  }

  const message = gracePeriod.active
    ? `Grace period is active${gracePeriod.endDate ? ` until ${new Date(gracePeriod.endDate).toLocaleDateString()}` : ''}.`
    : `Account is ${delinquency.daysPastDue} day(s) past due.`;

  return (
    <section className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <div className="flex items-center justify-between gap-3">
        <p>{message}</p>
        <StatusBadge label={gracePeriod.active ? 'Grace Period' : 'Delinquent'} />
      </div>
    </section>
  );
}

export function BillingExperience({ view, invoiceId }: { view: BillingView; invoiceId?: string }) {
  const [summary, setSummary] = useState<BillingSummaryResponse | null>(null);
  const [invoiceDetail, setInvoiceDetail] = useState<InvoiceDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentMessage, setPaymentMessage] = useState('');
  const [paymentTone, setPaymentTone] = useState<'success' | 'danger' | 'info'>('info');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [isUpdatingAutopay, setIsUpdatingAutopay] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setIsLoading(true);
      setError('');
      setPaymentMessage('');

      try {
        const summaryResponse = await fetch('/api/billing-enrollment/billing/summary', { cache: 'no-store' });

        if (!summaryResponse.ok) {
          throw new Error('Unable to load billing information right now.');
        }

        const summaryPayload = (await summaryResponse.json()) as BillingSummaryResponse;

        if (!ignore) {
          setSummary(summaryPayload);
          setSelectedMethod(summaryPayload.paymentMethods.find((method) => method.defaultMethod)?.id ?? summaryPayload.paymentMethods[0]?.id ?? '');
          setPaymentAmount(String(summaryPayload.nextInvoice.amountDue));
        }

        if (view === 'invoice-detail') {
          const id = invoiceId ?? summaryPayload.nextInvoice.id;
          const detailResponse = await fetch(`/api/billing-enrollment/billing/invoices/${id}`, { cache: 'no-store' });
          if (!detailResponse.ok) {
            throw new Error('Unable to load invoice detail.');
          }

          const detailPayload = (await detailResponse.json()) as InvoiceDetailResponse;
          if (!ignore) {
            setInvoiceDetail(detailPayload);
          }
        }
      } catch (nextError) {
        if (!ignore) {
          setError(nextError instanceof Error ? nextError.message : 'Unable to load billing information right now.');
          setSummary(null);
          setInvoiceDetail(null);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [view, invoiceId]);

  const totalPaid = useMemo(() => {
    if (!summary) {
      return 0;
    }
    return summary.paymentHistory.reduce((acc, payment) => acc + payment.amount, 0);
  }, [summary]);

  async function handleMakePayment() {
    if (!summary || !selectedMethod) {
      return;
    }

    setIsSubmittingPayment(true);
    setPaymentMessage('');

    try {
      const response = await fetch('/api/billing-enrollment/billing/payments/make', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          billingAccountId: summary.billingAccount.id,
          invoiceId: summary.nextInvoice.id,
          paymentMethodTokenId: selectedMethod,
          amount: Number(paymentAmount)
        })
      });

      const payload = (await response.json()) as { status?: string; message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? 'Payment failed.');
      }

      if (payload.status === 'failed') {
        setPaymentTone('danger');
        setPaymentMessage(payload.message ?? 'Payment failed. Please verify your payment method and try again.');
      } else {
        setPaymentTone('success');
        setPaymentMessage(payload.message ?? 'Payment submitted successfully.');
      }
    } catch (nextError) {
      setPaymentTone('danger');
      setPaymentMessage(nextError instanceof Error ? nextError.message : 'Payment failed.');
    } finally {
      setIsSubmittingPayment(false);
    }
  }

  async function handleAutopayToggle(nextEnabled: boolean) {
    if (!summary) {
      return;
    }

    setIsUpdatingAutopay(true);
    setPaymentMessage('');

    try {
      const response = await fetch('/api/billing-enrollment/billing/autopay', {
        method: 'PUT',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          enabled: nextEnabled,
          paymentMethodTokenId: summary.autopay.paymentMethodTokenId ?? selectedMethod
        })
      });

      if (!response.ok) {
        throw new Error('Unable to update autopay.');
      }

      const payload = (await response.json()) as BillingSummaryResponse['autopay'];
      setSummary({ ...summary, autopay: payload });
      setPaymentTone('success');
      setPaymentMessage(nextEnabled ? 'Autopay enabled.' : 'Autopay disabled.');
    } catch (nextError) {
      setPaymentTone('danger');
      setPaymentMessage(nextError instanceof Error ? nextError.message : 'Unable to update autopay.');
    } finally {
      setIsUpdatingAutopay(false);
    }
  }

  return (
    <div className="space-y-5" aria-busy={isLoading}>
      <section className="portal-card p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--tenant-primary-color)]">Billing Experience</p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">Billing and Payments</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Manage invoices, payment methods, autopay, and billing documents. Guest pay is not enabled yet, but this workflow is structured to add it later.
        </p>
      </section>

      <section className="portal-card p-4">
        <div className="flex flex-wrap gap-2">
          {navItems.map((item) => (
            <Link
              key={item.view}
              href={item.href}
              className={`inline-flex min-h-10 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition ${
                item.view === view
                  ? 'bg-[var(--tenant-primary-color)] text-white'
                  : 'border border-[var(--tenant-primary-color)] bg-white text-[var(--tenant-primary-color)] hover:bg-sky-50'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </section>

      <DelinquencyBanner summary={summary} />

      {isLoading ? (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, index) => (
            <article key={index} className="portal-card animate-pulse p-5">
              <div className="h-3 w-20 rounded bg-slate-200" />
              <div className="mt-3 h-8 w-28 rounded bg-slate-200" />
              <div className="mt-2 h-3 w-16 rounded bg-slate-200" />
            </article>
          ))}
        </section>
      ) : null}

      {!isLoading && error ? (
        <section>
          <EmptyState title="Billing data unavailable" description={error} />
        </section>
      ) : null}

      {!isLoading && !error && !summary ? (
        <section>
          <EmptyState title="No billing account yet" description="Billing and payment details will appear here after enrollment is completed." />
        </section>
      ) : null}

      {!isLoading && !error && summary ? (
        <>
          {paymentMessage ? (
            <section
              className={`rounded-xl border px-4 py-3 text-sm ${
                paymentTone === 'success'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                  : paymentTone === 'danger'
                    ? 'border-rose-300 bg-rose-50 text-rose-900'
                    : 'border-sky-300 bg-sky-50 text-sky-900'
              }`}
            >
              {paymentMessage}
            </section>
          ) : null}

          {(view === 'current-balance' || view === 'next-invoice') && (
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <article className="portal-card p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Current Balance</p>
                <p className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">{fmtCurrency(summary.currentBalance)}</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">Account {summary.billingAccount.accountNumber}</p>
              </article>
              <article className="portal-card p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Next Due Date</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{new Date(summary.nextInvoice.dueDate).toLocaleDateString()}</p>
                <div className="mt-2"><StatusBadge label={summary.nextInvoice.status} /></div>
              </article>
              <article className="portal-card p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Autopay</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{summary.autopay.enabled ? 'On' : 'Off'}</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{summary.autopay.nextRunDate ? `Next run ${new Date(summary.autopay.nextRunDate).toLocaleDateString()}` : 'No autopay schedule set'}</p>
              </article>
              <article className="portal-card p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Payments Posted</p>
                <p className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">{fmtCurrency(totalPaid)}</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{summary.paymentHistory.length} recorded payment(s)</p>
              </article>
            </section>
          )}

          {(view === 'next-invoice' || view === 'invoice-detail') && (
            <section className="grid gap-4 lg:grid-cols-3">
              <article className="portal-card p-5 lg:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Invoice Detail</h2>
                  <StatusBadge label={(invoiceDetail?.invoice.status ?? summary.nextInvoice.status).replace('_', ' ')} />
                </div>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">Invoice {(invoiceDetail?.invoice.id ?? summary.nextInvoice.id)}</p>
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-[var(--border-subtle)] text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                      <tr>
                        <th className="px-2 py-2">Line</th>
                        <th className="px-2 py-2">Category</th>
                        <th className="px-2 py-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(invoiceDetail?.invoice.lines ?? summary.nextInvoice.lines).map((line) => (
                        <tr key={line.id} className="border-b border-[var(--border-subtle)]">
                          <td className="px-2 py-3 text-[var(--text-secondary)]">{line.description}</td>
                          <td className="px-2 py-3 capitalize text-[var(--text-secondary)]">{line.category.replace('_', ' ')}</td>
                          <td className="px-2 py-3 text-right font-semibold text-[var(--text-primary)]">{fmtCurrency(line.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex justify-end">
                  <p className="text-lg font-semibold text-[var(--text-primary)]">Total: {fmtCurrency(invoiceDetail?.invoice.amountDue ?? summary.nextInvoice.amountDue)}</p>
                </div>
              </article>

              <article className="portal-card p-5">
                <h3 className="text-base font-semibold text-[var(--text-primary)]">Payment Timeline</h3>
                <ol className="mt-4 space-y-3">
                  {(invoiceDetail?.timeline ?? [
                    { label: 'Invoice issued', date: summary.nextInvoice.issuedDate, status: 'completed' },
                    { label: 'Invoice due', date: summary.nextInvoice.dueDate, status: 'pending' },
                    { label: 'Payment paid', date: '-', status: 'pending' },
                    { label: 'Payment posted', date: '-', status: 'pending' }
                  ]).map((step, index) => (
                    <li key={`${step.label}-${index}`} className="rounded-lg border border-[var(--border-subtle)] bg-slate-50 px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-[var(--text-primary)]">{step.label}</p>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${toneForStatus(step.status) === 'success' ? 'bg-emerald-50 text-emerald-700' : toneForStatus(step.status) === 'warning' ? 'bg-amber-50 text-amber-700' : toneForStatus(step.status) === 'danger' ? 'bg-rose-50 text-rose-700' : 'bg-sky-50 text-sky-700'}`}>{step.status}</span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--text-secondary)]">{step.date === '-' ? 'Pending' : new Date(step.date).toLocaleDateString()}</p>
                    </li>
                  ))}
                </ol>
              </article>
            </section>
          )}

          {view === 'payment-history' && (
            <section className="portal-card p-5">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Payment History</h2>
              {summary.paymentHistory.length === 0 ? (
                <div className="mt-4">
                  <EmptyState title="No payments yet" description="Completed payments will appear once your first premium payment is posted." />
                </div>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-[var(--border-subtle)] text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                      <tr>
                        <th className="px-2 py-2">Payment ID</th>
                        <th className="px-2 py-2">Invoice</th>
                        <th className="px-2 py-2">Date</th>
                        <th className="px-2 py-2">Method</th>
                        <th className="px-2 py-2 text-right">Amount</th>
                        <th className="px-2 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.paymentHistory.map((payment) => (
                        <tr key={payment.id} className="border-b border-[var(--border-subtle)]">
                          <td className="px-2 py-3 font-medium text-[var(--text-primary)]">{payment.id}</td>
                          <td className="px-2 py-3 text-[var(--text-secondary)]">{payment.invoiceId}</td>
                          <td className="px-2 py-3 text-[var(--text-secondary)]">{new Date(payment.initiatedAt).toLocaleDateString()}</td>
                          <td className="px-2 py-3 text-[var(--text-secondary)]">{payment.methodLabel}</td>
                          <td className="px-2 py-3 text-right font-semibold text-[var(--text-primary)]">{fmtCurrency(payment.amount)}</td>
                          <td className="px-2 py-3"><StatusBadge label={payment.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {view === 'make-payment' && (
            <section className="grid gap-4 lg:grid-cols-3">
              <article className="portal-card p-5 lg:col-span-2">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Make a Payment</h2>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">Submit a one-time premium payment for your next invoice.</p>
                <form
                  className="mt-4 grid gap-4 sm:grid-cols-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void handleMakePayment();
                  }}
                >
                  <label className="flex flex-col gap-2 text-sm font-medium text-[var(--text-primary)]">
                    Invoice
                    <input className="h-11 rounded-lg border border-[var(--border-subtle)] px-3" value={summary.nextInvoice.id} disabled />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-medium text-[var(--text-primary)]">
                    Amount
                    <input
                      className="h-11 rounded-lg border border-[var(--border-subtle)] px-3"
                      inputMode="decimal"
                      value={paymentAmount}
                      onChange={(event) => setPaymentAmount(event.target.value)}
                    />
                  </label>
                  <label className="sm:col-span-2 flex flex-col gap-2 text-sm font-medium text-[var(--text-primary)]">
                    Payment Method
                    <select
                      className="h-11 rounded-lg border border-[var(--border-subtle)] px-3"
                      value={selectedMethod}
                      onChange={(event) => setSelectedMethod(event.target.value)}
                    >
                      {summary.paymentMethods.map((method) => (
                        <option key={method.id} value={method.id}>
                          {method.maskedLabel}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      disabled={isSubmittingPayment}
                      className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isSubmittingPayment ? 'Processing...' : 'Submit Payment'}
                    </button>
                  </div>
                </form>
              </article>

              <article className="portal-card p-5">
                <h3 className="text-base font-semibold text-[var(--text-primary)]">Next Invoice</h3>
                <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{fmtCurrency(summary.nextInvoice.amountDue)}</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">Due {new Date(summary.nextInvoice.dueDate).toLocaleDateString()}</p>
                <div className="mt-3"><StatusBadge label={summary.nextInvoice.status} /></div>
              </article>
            </section>
          )}

          {view === 'payment-methods' && (
            <section className="portal-card p-5">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Saved Payment Methods</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">Manage cards and bank accounts used for premium payments.</p>
              <ul className="mt-4 space-y-2">
                {summary.paymentMethods.map((method) => (
                  <li key={method.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border-subtle)] bg-slate-50 px-3 py-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{method.maskedLabel}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{method.type === 'card' ? method.brand ?? 'Card' : 'Bank Account'}{method.expiresAt ? ` • Expires ${method.expiresAt}` : ''}</p>
                    </div>
                    {method.defaultMethod ? <StatusBadge label="Default" /> : <StatusBadge label="Saved" />}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {view === 'autopay' && (
            <section className="grid gap-4 lg:grid-cols-3">
              <article className="portal-card p-5 lg:col-span-2">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Autopay Management</h2>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">Turn autopay on or off and choose your preferred payment method.</p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">Autopay Status</p>
                    <p className="text-xs text-[var(--text-secondary)]">{summary.autopay.enabled ? `Enabled${summary.autopay.nextRunDate ? `, next run ${new Date(summary.autopay.nextRunDate).toLocaleDateString()}` : ''}` : 'Disabled'}</p>
                  </div>
                  <button
                    type="button"
                    disabled={isUpdatingAutopay}
                    onClick={() => void handleAutopayToggle(!summary.autopay.enabled)}
                    className={`inline-flex min-h-10 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold ${
                      summary.autopay.enabled
                        ? 'border border-rose-300 bg-white text-rose-700'
                        : 'bg-[var(--tenant-primary-color)] text-white'
                    } disabled:cursor-not-allowed disabled:opacity-70`}
                  >
                    {isUpdatingAutopay ? 'Updating...' : summary.autopay.enabled ? 'Disable Autopay' : 'Enable Autopay'}
                  </button>
                </div>
              </article>

              <article className="portal-card p-5">
                <h3 className="text-base font-semibold text-[var(--text-primary)]">Payment Method</h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  {summary.paymentMethods.find((method) => method.id === summary.autopay.paymentMethodTokenId)?.maskedLabel ?? 'No method selected'}
                </p>
              </article>
            </section>
          )}

          {view === 'statements' && (
            <section className="portal-card p-5">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Statements / Tax Documents</h2>
              {summary.statements.length === 0 ? (
                <div className="mt-4">
                  <EmptyState title="No statements yet" description="Statements and tax documents will be available after billing activity starts." />
                </div>
              ) : (
                <ul className="mt-4 space-y-2">
                  {summary.statements.map((statement) => (
                    <li key={statement.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border-subtle)] bg-slate-50 px-3 py-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">{statement.title}</p>
                        <p className="text-xs text-[var(--text-secondary)]">{statement.period} • {statement.kind === 'tax_document' ? 'Tax Document' : 'Statement'}</p>
                      </div>
                      {statement.downloadable ? (
                        <a
                          href={statement.downloadHref}
                          className="inline-flex min-h-9 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] px-4 text-sm font-semibold text-[var(--tenant-primary-color)]"
                        >
                          Download
                        </a>
                      ) : (
                        <StatusBadge label="Unavailable" />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {view === 'current-balance' && (
            <section className="grid gap-4 lg:grid-cols-2">
              <article className="portal-card p-5">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent Refunds / Reversals</h2>
                {summary.refundsAndReversals.length === 0 ? (
                  <p className="mt-3 text-sm text-[var(--text-secondary)]">No refunds or reversals have posted.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {summary.refundsAndReversals.map((item) => (
                      <li key={item.id} className="rounded-lg border border-[var(--border-subtle)] bg-slate-50 px-3 py-2 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold capitalize text-[var(--text-primary)]">{item.type}</span>
                          <span className="text-[var(--text-primary)]">{fmtCurrency(item.amount)}</span>
                        </div>
                        <p className="mt-1 text-xs text-[var(--text-secondary)]">{item.reason}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </article>

              <article className="portal-card p-5">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Quick Actions</h2>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <Link href="/dashboard/billing-enrollment/payments/make" className="rounded-lg border border-[var(--border-subtle)] bg-slate-50 px-3 py-2 text-sm font-semibold text-[var(--tenant-primary-color)]">Make Payment</Link>
                  <Link href="/dashboard/billing-enrollment/payments/autopay" className="rounded-lg border border-[var(--border-subtle)] bg-slate-50 px-3 py-2 text-sm font-semibold text-[var(--tenant-primary-color)]">Manage Autopay</Link>
                  <Link href="/dashboard/billing-enrollment/payments/statements" className="rounded-lg border border-[var(--border-subtle)] bg-slate-50 px-3 py-2 text-sm font-semibold text-[var(--tenant-primary-color)]">View Statements</Link>
                  <Link href="/dashboard/billing-enrollment/payments/history" className="rounded-lg border border-[var(--border-subtle)] bg-slate-50 px-3 py-2 text-sm font-semibold text-[var(--tenant-primary-color)]">Payment History</Link>
                </div>
              </article>
            </section>
          )}
        </>
      ) : null}
    </div>
  );
}
