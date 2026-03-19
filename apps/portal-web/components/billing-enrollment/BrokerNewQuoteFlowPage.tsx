'use client';

import { useState } from 'react';

import { createMockQuoteSummary, getBrokerQuoteIntakeOptions } from '../../lib/broker-sales-workspace-data';
import { InlineButton, PageHeader, SurfaceCard } from '../portal-ui';
import { BrokerWorkflowStatusBadge } from './BrokerWorkflowStatusBadge';

type Step = 1 | 2 | 3 | 4;

export function BrokerNewQuoteFlowPage({ brokerName }: { brokerName: string }) {
  const intakeOptions = getBrokerQuoteIntakeOptions();
  const [step, setStep] = useState<Step>(1);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [prospectName, setProspectName] = useState('');
  const [marketSegment, setMarketSegment] = useState('Small group');
  const [productsRequested, setProductsRequested] = useState<string[]>(['Medical']);
  const [effectiveDateTarget, setEffectiveDateTarget] = useState('2026-07-01');
  const [censusStatus, setCensusStatus] = useState<'Pending' | 'Uploaded'>('Pending');
  const [saved, setSaved] = useState(false);

  const quoteSummary = saved
    ? createMockQuoteSummary({
        selectedGroupId,
        prospectName,
        marketSegment,
        productsRequested,
        effectiveDateTarget,
        censusStatus,
        assignedBrokerRep: brokerName
      })
    : null;

  function toggleProduct(product: string) {
    setProductsRequested((current) =>
      current.includes(product)
        ? current.filter((item) => item !== product)
        : [...current, product]
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Broker E&B Portal"
        title="New quote intake"
        description="Capture a broker quote request, define requested products, track census readiness, and generate a mock quote summary for review."
        actions={<InlineButton href="/broker/quotes" tone="secondary">Back to quotes</InlineButton>}
      />

      <SurfaceCard title="Quote intake steps" description="Work through a simple broker-ready intake flow for new business or incumbent quoting.">
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((item) => {
            const active = step === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setStep(item as Step)}
                className={`inline-flex min-h-10 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold ${
                  active
                    ? 'bg-[var(--tenant-primary-color)] text-white'
                    : 'border border-[var(--border-subtle)] bg-white text-[var(--text-secondary)]'
                }`}
              >
                Step {item}
              </button>
            );
          })}
        </div>
      </SurfaceCard>

      {saved && quoteSummary ? (
        <SurfaceCard title="Quote summary" description="Mock quote record saved for broker review.">
          <div className="grid gap-4 md:grid-cols-2 text-sm text-[var(--text-secondary)]">
            <div className="rounded-3xl border border-[var(--border-subtle)] bg-white p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Prospect / employer</p>
              <p className="mt-3 font-semibold text-[var(--text-primary)]">{quoteSummary.prospectOrEmployerName}</p>
              <p className="mt-2">Segment: {quoteSummary.marketSegment}</p>
              <p className="mt-2">Effective date: {quoteSummary.effectiveDateTarget}</p>
            </div>
            <div className="rounded-3xl border border-[var(--border-subtle)] bg-white p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Quote status</p>
              <div className="mt-3">
                <BrokerWorkflowStatusBadge status={quoteSummary.status} />
              </div>
              <p className="mt-3">Products: {quoteSummary.productsRequested.join(', ')}</p>
              <p className="mt-2">Assigned rep: {quoteSummary.assignedBrokerRep}</p>
            </div>
          </div>
          <div className="mt-4 rounded-3xl border border-[var(--border-subtle)] bg-white p-4">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Next actions</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--text-secondary)]">
              {quoteSummary.nextActions.map((action) => (
                <li key={action}>• {action}</li>
              ))}
            </ul>
          </div>
        </SurfaceCard>
      ) : null}

      <SurfaceCard title="Quote intake form" description="This mocked flow captures enough broker context to demo an end-to-end quote start experience.">
        <div className="grid gap-4 md:grid-cols-2">
          {step === 1 ? (
            <>
              <label className="text-sm text-[var(--text-secondary)]">
                <span className="mb-1 block font-medium text-[var(--text-primary)]">Existing group</span>
                <select
                  value={selectedGroupId}
                  onChange={(event) => setSelectedGroupId(event.target.value)}
                  className="portal-input w-full bg-white px-4 py-3 text-sm outline-none focus:border-[var(--tenant-primary-color)]"
                >
                  <option value="">Select existing group or leave blank for prospect</option>
                  {intakeOptions.existingGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-[var(--text-secondary)]">
                <span className="mb-1 block font-medium text-[var(--text-primary)]">Prospect name</span>
                <input
                  value={prospectName}
                  onChange={(event) => setProspectName(event.target.value)}
                  placeholder="Enter prospect name if not using an existing group"
                  className="portal-input w-full px-4 py-3 text-sm outline-none focus:border-[var(--tenant-primary-color)]"
                />
              </label>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <label className="text-sm text-[var(--text-secondary)]">
                <span className="mb-1 block font-medium text-[var(--text-primary)]">Market segment</span>
                <select
                  value={marketSegment}
                  onChange={(event) => setMarketSegment(event.target.value)}
                  className="portal-input w-full bg-white px-4 py-3 text-sm outline-none focus:border-[var(--tenant-primary-color)]"
                >
                  {intakeOptions.segments.map((segment) => (
                    <option key={segment} value={segment}>
                      {segment}
                    </option>
                  ))}
                </select>
              </label>
              <div className="text-sm text-[var(--text-secondary)] md:col-span-2">
                <span className="mb-2 block font-medium text-[var(--text-primary)]">Requested coverage / products</span>
                <div className="flex flex-wrap gap-2">
                  {intakeOptions.products.map((product) => {
                    const active = productsRequested.includes(product);
                    return (
                      <button
                        key={product}
                        type="button"
                        onClick={() => toggleProduct(product)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold ${
                          active
                            ? 'bg-[var(--tenant-primary-color)] text-white'
                            : 'border border-[var(--border-subtle)] bg-white text-[var(--text-secondary)]'
                        }`}
                      >
                        {product}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <label className="text-sm text-[var(--text-secondary)]">
                <span className="mb-1 block font-medium text-[var(--text-primary)]">Target effective date</span>
                <input
                  type="date"
                  value={effectiveDateTarget}
                  onChange={(event) => setEffectiveDateTarget(event.target.value)}
                  className="portal-input w-full px-4 py-3 text-sm outline-none focus:border-[var(--tenant-primary-color)]"
                />
              </label>
              <label className="text-sm text-[var(--text-secondary)]">
                <span className="mb-1 block font-medium text-[var(--text-primary)]">Census status</span>
                <select
                  value={censusStatus}
                  onChange={(event) => setCensusStatus(event.target.value as 'Pending' | 'Uploaded')}
                  className="portal-input w-full bg-white px-4 py-3 text-sm outline-none focus:border-[var(--tenant-primary-color)]"
                >
                  <option value="Pending">Census pending</option>
                  <option value="Uploaded">Census uploaded</option>
                </select>
              </label>
            </>
          ) : null}

          {step === 4 ? (
            <label className="text-sm text-[var(--text-secondary)] md:col-span-2">
              <span className="mb-1 block font-medium text-[var(--text-primary)]">Upload census (mock)</span>
              <div className="rounded-3xl border border-dashed border-[var(--border-subtle)] bg-slate-50 p-4">
                <input type="file" className="text-sm" />
                <p className="mt-2 text-xs text-[var(--text-muted)]">
                  File selection is mocked for this sprint, but the upload step is represented in the workflow.
                </p>
              </div>
            </label>
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((step - 1) as Step)}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] bg-white px-5 py-3 text-sm font-semibold text-[var(--tenant-primary-color)]"
            >
              Previous step
            </button>
          ) : null}
          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((step + 1) as Step)}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-5 py-3 text-sm font-semibold text-white"
            >
              Next step
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setSaved(true)}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-5 py-3 text-sm font-semibold text-white"
            >
              Save draft
            </button>
          )}
        </div>
      </SurfaceCard>
    </div>
  );
}
