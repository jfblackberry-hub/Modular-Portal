'use client';

import { useMemo, useState } from 'react';

import type {
  ProviderPortalConfig,
  ProviderPortalVariant
} from '../../../config/providerPortalConfig';
import { PageHeader, StatusBadge, SurfaceCard } from '../../portal-ui';

type ClaimStatus =
  | 'Draft'
  | 'Submitted'
  | 'In Review'
  | 'More Info Needed'
  | 'Approved'
  | 'Denied'
  | 'Paid';

type ClaimRow = {
  claimNumber: string;
  patient: string;
  memberId: string;
  serviceDate: string;
  billedAmount: string;
  allowedAmount: string;
  paidAmount: string;
  status: ClaimStatus;
  billingProvider: string;
  renderingProvider: string;
};

const claimRows: ClaimRow[] = [
  {
    claimNumber: 'CLM-100245',
    patient: 'Taylor Morgan',
    memberId: 'M-48291',
    serviceDate: '2026-03-05',
    billedAmount: '$1,250.00',
    allowedAmount: '$980.00',
    paidAmount: '$760.00',
    status: 'Paid',
    billingProvider: 'Riverside Health Group',
    renderingProvider: 'Jordan Lee, MD'
  },
  {
    claimNumber: 'CLM-100233',
    patient: 'Jordan Patel',
    memberId: 'M-77420',
    serviceDate: '2026-03-02',
    billedAmount: '$420.00',
    allowedAmount: '$300.00',
    paidAmount: '$0.00',
    status: 'More Info Needed',
    billingProvider: 'Riverside Health Group',
    renderingProvider: 'Jordan Lee, MD'
  },
  {
    claimNumber: 'CLM-100217',
    patient: 'Avery Brooks',
    memberId: 'M-55832',
    serviceDate: '2026-02-28',
    billedAmount: '$860.00',
    allowedAmount: '$670.00',
    paidAmount: '$0.00',
    status: 'In Review',
    billingProvider: 'Riverside Health Group',
    renderingProvider: 'Jordan Lee, MD'
  }
];

function ClaimDetailModal({
  claim,
  onClose
}: {
  claim: ClaimRow;
  onClose: () => void;
}) {
  const serviceLines = [
    {
      line: '1',
      code: '99213',
      description: 'Established patient office visit',
      billed: '$220.00',
      allowed: '$180.00',
      paid: '$144.00'
    },
    {
      line: '2',
      code: '80053',
      description: 'Comprehensive metabolic panel',
      billed: '$130.00',
      allowed: '$95.00',
      paid: '$76.00'
    }
  ];

  const timeline = [
    'Claim created in provider system.',
    'Claim submitted to payer clearinghouse.',
    'Claim accepted for adjudication.',
    'Additional documentation check completed.',
    'Payment and remittance processing.'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 modal-fade-in"
        onClick={onClose}
        aria-label="Close claim detail"
      />
      <section className="modal-scale-in relative z-10 max-h-[90vh] w-full max-w-4xl overflow-auto rounded-2xl border border-[var(--border-subtle)] bg-white p-6 shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[var(--tenant-primary-color)]">Claim detail</p>
            <h2 className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{claim.claimNumber}</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{claim.patient} ({claim.memberId})</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge label={claim.status} />
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--border-subtle)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)]"
            >
              Close
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <article className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Billed</p>
            <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{claim.billedAmount}</p>
          </article>
          <article className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Allowed</p>
            <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{claim.allowedAmount}</p>
          </article>
          <article className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Paid</p>
            <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{claim.paidAmount}</p>
          </article>
          <article className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Service Date</p>
            <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{claim.serviceDate}</p>
          </article>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Service Lines</h3>
            <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)]">
              <table className="portal-data-table w-full border-collapse bg-white text-sm">
                <thead>
                  <tr className="text-left text-[var(--text-muted)]">
                    <th className="px-4 py-3 font-medium">Line</th>
                    <th className="px-4 py-3 font-medium">Code</th>
                    <th className="px-4 py-3 font-medium">Description</th>
                    <th className="px-4 py-3 font-medium">Billed</th>
                    <th className="px-4 py-3 font-medium">Allowed</th>
                    <th className="px-4 py-3 font-medium">Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceLines.map((line) => (
                    <tr key={line.line} className="border-t border-[var(--border-subtle)]">
                      <td className="px-4 py-3 text-[var(--text-primary)]">{line.line}</td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">{line.code}</td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">{line.description}</td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">{line.billed}</td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">{line.allowed}</td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">{line.paid}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <article className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
                <h4 className="text-sm font-semibold text-[var(--text-primary)]">Adjustments / Denials</h4>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">Placeholder: CO-45 contractual adjustment, PR-1 deductible.</p>
              </article>
              <article className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
                <h4 className="text-sm font-semibold text-[var(--text-primary)]">EOB / EOP</h4>
                <button
                  type="button"
                  className="mt-2 inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] px-4 py-2 text-sm font-semibold text-[var(--tenant-primary-color)]"
                >
                  Download EOB/EOP (Placeholder)
                </button>
              </article>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Timeline / History</h3>
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              {timeline.map((item) => (
                <li key={item} className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
                  {item}
                </li>
              ))}
            </ul>

            <div className="rounded-xl border border-[var(--border-subtle)] bg-white p-4">
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">Claim Actions</h4>
              <div className="mt-3 flex flex-wrap gap-2">
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
                  View Claim Timeline
                </button>
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

export function ProviderClaimsPage({
  config,
  variant,
  embedded = false
}: {
  config: ProviderPortalConfig;
  variant: ProviderPortalVariant;
  embedded?: boolean;
}) {
  const [selectedClaim, setSelectedClaim] = useState<ClaimRow | null>(null);

  const searchStatusOptions = [
    'Any Status',
    'Draft',
    'Submitted',
    'In Review',
    'More Info Needed',
    'Approved',
    'Denied',
    'Paid'
  ];

  const pageTitle = variant === 'medical' ? 'Claims Workspace' : config.routeContent.claims.title;

  return (
    <div className="space-y-6">
      {embedded ? null : (
        <PageHeader
          eyebrow={config.displayName}
          title={pageTitle}
          description="Search claims, review adjudication details, and take the next claims action quickly."
        />
      )}

      <SurfaceCard title="Claim Search" description="Filter claims by identifiers, dates, status, and provider context.">
        <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="text-sm text-[var(--text-secondary)]">
            <span className="mb-1 block font-medium text-[var(--text-primary)]">Claim Number</span>
            <input className="portal-input px-3 py-2 text-sm" placeholder="Enter claim number" />
          </label>
          <label className="text-sm text-[var(--text-secondary)]">
            <span className="mb-1 block font-medium text-[var(--text-primary)]">Patient Name</span>
            <input className="portal-input px-3 py-2 text-sm" placeholder="Enter patient name" />
          </label>
          <label className="text-sm text-[var(--text-secondary)]">
            <span className="mb-1 block font-medium text-[var(--text-primary)]">Member ID</span>
            <input className="portal-input px-3 py-2 text-sm" placeholder="Enter member ID" />
          </label>
          <label className="text-sm text-[var(--text-secondary)]">
            <span className="mb-1 block font-medium text-[var(--text-primary)]">Status</span>
            <select className="portal-input px-3 py-2 text-sm" defaultValue="Any Status">
              {searchStatusOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
          <label className="text-sm text-[var(--text-secondary)]">
            <span className="mb-1 block font-medium text-[var(--text-primary)]">Date Range From</span>
            <input type="date" className="portal-input px-3 py-2 text-sm" />
          </label>
          <label className="text-sm text-[var(--text-secondary)]">
            <span className="mb-1 block font-medium text-[var(--text-primary)]">Date Range To</span>
            <input type="date" className="portal-input px-3 py-2 text-sm" />
          </label>
          <label className="text-sm text-[var(--text-secondary)]">
            <span className="mb-1 block font-medium text-[var(--text-primary)]">Billing Provider</span>
            <input className="portal-input px-3 py-2 text-sm" placeholder="Billing provider name" />
          </label>
          <label className="text-sm text-[var(--text-secondary)]">
            <span className="mb-1 block font-medium text-[var(--text-primary)]">Rendering Provider</span>
            <input className="portal-input px-3 py-2 text-sm" placeholder="Rendering provider name" />
          </label>
        </form>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Search Claims
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] bg-white px-5 py-3 text-sm font-semibold text-[var(--tenant-primary-color)] transition hover:bg-sky-50"
          >
            Reset Filters
          </button>
        </div>
      </SurfaceCard>

      <SurfaceCard title="Claim Results" description="Review claim outcomes and open a detailed claim workspace.">
        <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)]">
          <table className="portal-data-table w-full border-collapse bg-white text-sm">
            <thead>
              <tr className="text-left text-[var(--text-muted)]">
                <th className="px-4 py-3 font-medium">Claim Number</th>
                <th className="px-4 py-3 font-medium">Patient</th>
                <th className="px-4 py-3 font-medium">Service Date</th>
                <th className="px-4 py-3 font-medium">Billed Amount</th>
                <th className="px-4 py-3 font-medium">Allowed Amount</th>
                <th className="px-4 py-3 font-medium">Paid Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {claimRows.map((claim) => (
                <tr key={claim.claimNumber} className="border-t border-[var(--border-subtle)]">
                  <td className="px-4 py-3 text-[var(--text-primary)]">{claim.claimNumber}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{claim.patient}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{claim.serviceDate}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{claim.billedAmount}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{claim.allowedAmount}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{claim.paidAmount}</td>
                  <td className="px-4 py-3"><StatusBadge label={claim.status} /></td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setSelectedClaim(claim)}
                      className="inline-flex min-h-9 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] px-3 py-1.5 text-xs font-semibold text-[var(--tenant-primary-color)]"
                    >
                      Open Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SurfaceCard>

      <SurfaceCard title="Related Actions" description="Common next actions for claims and payment workflows.">
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
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] px-4 py-2 text-sm font-semibold text-[var(--tenant-primary-color)]"
          >
            Download Remittance
          </button>
          <button
            type="button"
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-4 py-2 text-sm font-semibold text-white"
          >
            View Claim Timeline
          </button>
        </div>
      </SurfaceCard>

      {selectedClaim ? (
        <ClaimDetailModal claim={selectedClaim} onClose={() => setSelectedClaim(null)} />
      ) : null}
    </div>
  );
}
