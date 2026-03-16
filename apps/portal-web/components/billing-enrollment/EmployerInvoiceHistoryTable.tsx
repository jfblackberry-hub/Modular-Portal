'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import type { EmployerInvoiceRecord, EmployerInvoiceStatus, EmployerPaymentStatus } from '../../lib/employer-billing-data';
import { EmptyState, StatusBadge } from '../portal-ui';

type Filters = {
  billingPeriod: 'all' | string;
  invoiceStatus: 'all' | EmployerInvoiceStatus;
  paymentStatus: 'all' | EmployerPaymentStatus | 'Unpaid';
  minAmount: string;
  maxAmount: string;
  dueDateFrom: string;
  dueDateTo: string;
};

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

export function EmployerInvoiceHistoryTable({ invoices }: { invoices: EmployerInvoiceRecord[] }) {
  const [filters, setFilters] = useState<Filters>({
    billingPeriod: 'all',
    invoiceStatus: 'all',
    paymentStatus: 'all',
    minAmount: '',
    maxAmount: '',
    dueDateFrom: '',
    dueDateTo: ''
  });

  const billingPeriods = useMemo(() => Array.from(new Set(invoices.map((invoice) => invoice.billingPeriod))).sort(), [invoices]);

  const filtered = useMemo(() => {
    return invoices.filter((invoice) => {
      const periodMatch = filters.billingPeriod === 'all' || invoice.billingPeriod === filters.billingPeriod;
      const invoiceStatusMatch = filters.invoiceStatus === 'all' || invoice.status === filters.invoiceStatus;
      const paymentStatusMatch = filters.paymentStatus === 'all' || invoice.paymentStatus === filters.paymentStatus;
      const minAmount = filters.minAmount ? Number(filters.minAmount) : null;
      const maxAmount = filters.maxAmount ? Number(filters.maxAmount) : null;
      const minAmountMatch = minAmount === null || invoice.invoiceAmount >= minAmount;
      const maxAmountMatch = maxAmount === null || invoice.invoiceAmount <= maxAmount;
      const dueFromMatch = !filters.dueDateFrom || invoice.dueDate >= filters.dueDateFrom;
      const dueToMatch = !filters.dueDateTo || invoice.dueDate <= filters.dueDateTo;

      return periodMatch && invoiceStatusMatch && paymentStatusMatch && minAmountMatch && maxAmountMatch && dueFromMatch && dueToMatch;
    });
  }, [filters, invoices]);

  return (
    <div className="space-y-5">
      <section className="portal-card p-6 sm:p-8">
        <p className="text-[13px] font-medium text-[var(--tenant-primary-color)]">Billing &amp; Payments</p>
        <h1 className="mt-2 text-[28px] font-semibold leading-tight text-[var(--text-primary)] sm:text-[32px]">
          Invoice History
        </h1>
      </section>

      <section className="portal-card p-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Billing Period</span>
            <select value={filters.billingPeriod} onChange={(event) => setFilters((current) => ({ ...current, billingPeriod: event.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm">
              <option value="all">All periods</option>
              {billingPeriods.map((period) => <option key={period} value={period}>{period}</option>)}
            </select>
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Invoice Status</span>
            <select value={filters.invoiceStatus} onChange={(event) => setFilters((current) => ({ ...current, invoiceStatus: event.target.value as Filters['invoiceStatus'] }))} className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm">
              <option value="all">All statuses</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Overdue">Overdue</option>
            </select>
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Payment Status</span>
            <select value={filters.paymentStatus} onChange={(event) => setFilters((current) => ({ ...current, paymentStatus: event.target.value as Filters['paymentStatus'] }))} className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm">
              <option value="all">All payment states</option>
              <option value="Succeeded">Succeeded</option>
              <option value="Processing">Processing</option>
              <option value="Failed">Failed</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Min Amount</span>
            <input type="number" value={filters.minAmount} onChange={(event) => setFilters((current) => ({ ...current, minAmount: event.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm" placeholder="0" />
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Max Amount</span>
            <input type="number" value={filters.maxAmount} onChange={(event) => setFilters((current) => ({ ...current, maxAmount: event.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm" placeholder="300000" />
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Due Date From</span>
            <input type="date" value={filters.dueDateFrom} onChange={(event) => setFilters((current) => ({ ...current, dueDateFrom: event.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm" />
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Due Date To</span>
            <input type="date" value={filters.dueDateTo} onChange={(event) => setFilters((current) => ({ ...current, dueDateTo: event.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm" />
          </label>
        </div>
      </section>

      <section className="portal-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Invoices</h2>
          <p className="text-sm text-[var(--text-secondary)]">Showing {filtered.length} of {invoices.length}</p>
        </div>

        {invoices.length === 0 ? (
          <div className="mt-4"><EmptyState title="No invoices generated yet" description="Invoice history will populate after first billing cycle generation." /></div>
        ) : filtered.length === 0 ? (
          <div className="mt-4"><EmptyState title="No matching results" description="Adjust filters to find matching invoices." /></div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="portal-data-table w-full border-collapse bg-white text-sm">
              <thead>
                <tr>
                  <th>Invoice Number</th>
                  <th>Billing Period</th>
                  <th>Invoice Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Payment Method</th>
                  <th>Payment Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>{invoice.invoiceNumber}</td>
                    <td>{invoice.billingPeriod}</td>
                    <td>{formatCurrency(invoice.invoiceAmount)}</td>
                    <td>{formatDate(invoice.dueDate)}</td>
                    <td><StatusBadge label={invoice.status} /></td>
                    <td>{invoice.paymentMethod ?? '—'}</td>
                    <td>{formatDate(invoice.paymentDate)}</td>
                    <td>
                      <div className="flex flex-wrap gap-1.5">
                        <Link href={`/dashboard/billing-enrollment/billing-invoices/${invoice.id}`} className="rounded-full border border-[var(--tenant-primary-color)] px-2.5 py-1 text-xs font-semibold text-[var(--tenant-primary-color)]">View Invoice</Link>
                        <Link href={`/dashboard/billing-enrollment/billing-invoices/${invoice.id}/download/pdf`} className="rounded-full border border-[var(--border-subtle)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">Download PDF</Link>
                        <Link href={`/dashboard/billing-enrollment/billing-invoices/${invoice.id}/download/csv`} className="rounded-full border border-[var(--border-subtle)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">Download CSV</Link>
                        <Link href={`/dashboard/billing-enrollment/billing-invoices/${invoice.id}#payment-history`} className="rounded-full border border-[var(--border-subtle)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">View Payment Details</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
