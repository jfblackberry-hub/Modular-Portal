'use client';

import { useMemo, useState } from 'react';

import type { BrokerCommissionRecord } from '../../lib/broker-operations-data';
import { EmptyState, InlineButton, PageHeader, StatCard, StatusBadge, SurfaceCard } from '../portal-ui';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
}

export function BrokerCommissionsWorkspacePage({
  records
}: {
  records: BrokerCommissionRecord[];
}) {
  const [month, setMonth] = useState('March');
  const [quarter, setQuarter] = useState('Q1');
  const [year, setYear] = useState('2026');
  const [productLine, setProductLine] = useState('');
  const [group, setGroup] = useState('');

  const filtered = useMemo(
    () =>
      records.filter((record) => {
        if (month && record.month !== month) return false;
        if (quarter && record.quarter !== quarter) return false;
        if (year && String(record.year) !== year) return false;
        if (productLine && record.productLine !== productLine) return false;
        if (group && record.groupName !== group) return false;
        return true;
      }),
    [group, month, productLine, quarter, records, year]
  );

  const summary = useMemo(() => {
    const total = filtered.reduce((sum, item) => sum + item.amount, 0);
    const paid = filtered.filter((item) => item.status === 'Paid').reduce((sum, item) => sum + item.amount, 0);
    const pending = filtered
      .filter((item) => item.status === 'Pending')
      .reduce((sum, item) => sum + item.amount, 0);
    return {
      total,
      paid,
      pending,
      exceptions: filtered.filter((item) => item.hasException)
    };
  }, [filtered]);

  const byProductLine = useMemo(
    () =>
      Array.from(
        filtered.reduce((map, item) => {
          map.set(item.productLine, (map.get(item.productLine) ?? 0) + item.amount);
          return map;
        }, new Map<string, number>())
      ),
    [filtered]
  );

  const byGroup = useMemo(
    () =>
      Array.from(
        filtered.reduce((map, item) => {
          map.set(item.groupName, (map.get(item.groupName) ?? 0) + item.amount);
          return map;
        }, new Map<string, number>())
      ).sort((left, right) => right[1] - left[1]),
    [filtered]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Broker E&B Portal"
        title="Commissions"
        description="Review month-to-date production, pending commission activity, group-level performance, and statement exceptions from one broker-facing summary workspace."
        actions={<InlineButton href="/broker/documents" tone="secondary">Open statements</InlineButton>}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="MTD total" value={formatCurrency(summary.total)} detail="Total commissions in the current filtered view." tone="info" />
        <StatCard label="Paid" value={formatCurrency(summary.paid)} detail="Statements already paid and posted." tone="success" />
        <StatCard label="Pending" value={formatCurrency(summary.pending)} detail="Statements or splits awaiting final posting." tone="warning" />
        <StatCard label="Exceptions" value={summary.exceptions.length.toString()} detail="Commission records with reconciliation follow-up." tone="danger" />
      </section>

      <SurfaceCard title="Commission filters" description="Narrow the commission view by period, product line, or employer group.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[
            { label: 'Month', value: month, setter: setMonth, options: Array.from(new Set(records.map((item) => item.month))) },
            { label: 'Quarter', value: quarter, setter: setQuarter, options: Array.from(new Set(records.map((item) => item.quarter))) },
            { label: 'Year', value: year, setter: setYear, options: Array.from(new Set(records.map((item) => String(item.year)))) },
            { label: 'Product line', value: productLine, setter: setProductLine, options: Array.from(new Set(records.map((item) => item.productLine))) },
            { label: 'Group', value: group, setter: setGroup, options: Array.from(new Set(records.map((item) => item.groupName))) }
          ].map((field) => (
            <label key={field.label} className="text-sm text-[var(--text-secondary)]">
              <span className="mb-1 block font-medium text-[var(--text-primary)]">{field.label}</span>
              <select
                value={field.value}
                onChange={(event) => field.setter(event.target.value)}
                className="portal-input w-full bg-white px-4 py-3 text-sm outline-none focus:border-[var(--tenant-primary-color)]"
              >
                {field.label === 'Month' || field.label === 'Quarter' || field.label === 'Year' ? null : (
                  <option value="">All</option>
                )}
                {field.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </SurfaceCard>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_360px]">
        <div className="space-y-4">
          <SurfaceCard title="By group breakdown" description="Commission totals by employer group in the current filter set.">
            <div className="overflow-x-auto">
              <table className="portal-data-table w-full border-collapse bg-white text-sm">
                <thead>
                  <tr>
                    <th>Group</th>
                    <th>Total</th>
                    <th>Status mix</th>
                  </tr>
                </thead>
                <tbody>
                  {byGroup.map(([groupName, amount]) => (
                    <tr key={groupName}>
                      <td>{groupName}</td>
                      <td>{formatCurrency(amount)}</td>
                      <td>
                        {filtered.some((item) => item.groupName === groupName && item.hasException) ? (
                          <StatusBadge label="Pending review" />
                        ) : (
                          <StatusBadge label="Paid" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SurfaceCard>

          <SurfaceCard title="Commission exceptions" description="Records needing broker reconciliation or carrier follow-up.">
            {summary.exceptions.length === 0 ? (
              <EmptyState title="No exceptions in this view" description="All commission records in the current filter set are posted cleanly." />
            ) : (
              <div className="space-y-3">
                {summary.exceptions.map((item) => (
                  <div key={item.id} className="rounded-3xl border border-[var(--border-subtle)] bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{item.groupName}</h3>
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">{item.exceptionReason}</p>
                      </div>
                      <StatusBadge label="Needs review" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SurfaceCard>
        </div>

        <div className="space-y-4">
          <SurfaceCard title="By product line" description="Executive-friendly breakdown by major product line.">
            <div className="space-y-3">
              {byProductLine.map(([line, amount]) => (
                <div key={line} className="rounded-3xl border border-[var(--border-subtle)] bg-white p-4">
                  <p className="text-sm text-[var(--text-secondary)]">{line}</p>
                  <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{formatCurrency(amount)}</p>
                </div>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard title="Downloadable statements" description="Mock statement cards for broker review and future export workflows.">
            <div className="space-y-3">
              {filtered.slice(0, 4).map((item) => (
                <div key={`${item.id}-statement`} className="rounded-3xl border border-[var(--border-subtle)] bg-white p-4">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{item.statementTitle}</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{item.groupName}</p>
                  <p className="mt-2 text-xs text-[var(--text-muted)]">{item.month} {item.year} • {item.productLine}</p>
                </div>
              ))}
            </div>
          </SurfaceCard>
        </div>
      </div>
    </div>
  );
}
