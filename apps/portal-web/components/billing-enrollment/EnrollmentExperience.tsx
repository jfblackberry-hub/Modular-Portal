'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { EmptyState, StatusBadge } from '../portal-ui';

type EnrollmentView =
  | 'shop-plans'
  | 'compare-plans'
  | 'start-enrollment'
  | 'renew-coverage'
  | 'report-life-event'
  | 'manage-household'
  | 'verify-eligibility'
  | 'upload-documents'
  | 'status-tracker';

const flowNav: Array<{ label: string; href: string; view: EnrollmentView }> = [
  { label: 'Shop Plans', href: '/dashboard/billing-enrollment/plans', view: 'shop-plans' },
  { label: 'Compare Plans', href: '/dashboard/billing-enrollment/plans/compare', view: 'compare-plans' },
  { label: 'Start Enrollment', href: '/dashboard/billing-enrollment/enrollment/start', view: 'start-enrollment' },
  { label: 'Renew Coverage', href: '/dashboard/billing-enrollment/renewals', view: 'renew-coverage' },
  { label: 'Report Life Event', href: '/dashboard/billing-enrollment/renewals/life-event', view: 'report-life-event' },
  { label: 'Manage Household', href: '/dashboard/billing-enrollment/enrollment/household', view: 'manage-household' },
  { label: 'Verify Eligibility', href: '/dashboard/billing-enrollment/rules/verify', view: 'verify-eligibility' },
  { label: 'Upload Documents', href: '/dashboard/billing-enrollment/documents/upload', view: 'upload-documents' },
  { label: 'Status Tracker', href: '/dashboard/billing-enrollment/enrollment/status', view: 'status-tracker' }
];

const enrollmentSteps = [
  { key: 'shop', label: 'Shop Plans', help: 'Review plan premium and network fit.' },
  { key: 'household', label: 'Household Details', help: 'Confirm subscriber and dependent records.' },
  { key: 'eligibility', label: 'Verify Eligibility', help: 'Resolve any pending eligibility checks.' },
  { key: 'documents', label: 'Upload Documents', help: 'Provide all required verification files.' },
  { key: 'submit', label: 'Submit Enrollment', help: 'Submit and monitor pending approval status.' }
];

function Stepper({
  activeStep,
  completedSteps
}: {
  activeStep: string;
  completedSteps: string[];
}) {
  return (
    <ol className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5" aria-label="Enrollment steps">
      {enrollmentSteps.map((step, index) => {
        const isCompleted = completedSteps.includes(step.key);
        const isActive = activeStep === step.key;
        return (
          <li
            key={step.key}
            className={`rounded-xl border px-3 py-3 ${
              isActive
                ? 'border-[var(--tenant-primary-color)] bg-[var(--tenant-primary-soft-color)]'
                : isCompleted
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-[var(--border-subtle)] bg-slate-50'
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Step {index + 1}</p>
            <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{step.label}</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">{step.help}</p>
          </li>
        );
      })}
    </ol>
  );
}

export function EnrollmentExperience({ view }: { view: EnrollmentView }) {
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const today = new Date().toLocaleDateString();

  const header = useMemo(() => {
    switch (view) {
      case 'shop-plans':
        return {
          title: 'Shop Plans',
          description: 'Explore available plan options with plain-language summaries.'
        };
      case 'compare-plans':
        return {
          title: 'Compare Plans',
          description: 'Compare key plan costs and coverage side by side.'
        };
      case 'start-enrollment':
        return {
          title: 'Start Enrollment',
          description: 'Use the guided stepper to complete enrollment and save progress.'
        };
      case 'renew-coverage':
        return {
          title: 'Renew Coverage',
          description: 'Review renewal options and continue coverage for the next period.'
        };
      case 'report-life-event':
        return {
          title: 'Report Life Event',
          description: 'Submit qualifying life events and track pending review status.'
        };
      case 'manage-household':
        return {
          title: 'Manage Household / Dependents',
          description: 'Add or update subscriber and dependent household details.'
        };
      case 'verify-eligibility':
        return {
          title: 'Verify Eligibility',
          description: 'Run eligibility checks and review required follow-up steps.'
        };
      case 'upload-documents':
        return {
          title: 'Upload Required Documents',
          description: 'Upload, review, and track required enrollment documents.'
        };
      case 'status-tracker':
        return {
          title: 'Enrollment Status Tracker',
          description: 'Track progress, pending actions, effective dates, and approval state.'
        };
    }
  }, [view]);

  return (
    <div className="space-y-6">
      <section className="portal-card p-6 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--tenant-primary-color)]">Enrollment Experience</p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">{header.title}</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{header.description}</p>
      </section>

      <section className="portal-card p-4">
        <div className="flex flex-wrap gap-2">
          {flowNav.map((item) => (
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

      {(view === 'start-enrollment' || view === 'status-tracker') && (
        <section className="space-y-4">
          <Stepper activeStep={view === 'status-tracker' ? 'documents' : 'eligibility'} completedSteps={['shop', 'household']} />

          <div className="grid gap-4 md:grid-cols-2">
            <article className="portal-card p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Effective Date</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">Apr 1, 2026</p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">Requested start date for selected coverage.</p>
            </article>
            <article className="portal-card p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Pending Status</p>
              <div className="mt-2"><StatusBadge label="Pending Verification" /></div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">One required document is still under review.</p>
            </article>
          </div>

          <article className="portal-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Required Actions</h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">Complete these items to continue enrollment.</p>
              </div>
              <StatusBadge label="2 Open Actions" />
            </div>
            <ul className="mt-4 space-y-2">
              <li className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3 text-sm text-[var(--text-secondary)]">
                Upload income verification document
              </li>
              <li className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3 text-sm text-[var(--text-secondary)]">
                Confirm dependent date of birth
              </li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSavedAt(new Date().toLocaleTimeString())}
                className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] bg-white px-4 py-2 text-sm font-semibold text-[var(--tenant-primary-color)]"
              >
                Save and Resume Later
              </button>
              <button
                type="button"
                className="inline-flex min-h-10 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-4 py-2 text-sm font-semibold text-white"
              >
                Continue to Next Step
              </button>
            </div>
            {savedAt ? <p className="mt-2 text-xs text-[var(--text-muted)]">Progress saved at {savedAt}.</p> : null}
          </article>
        </section>
      )}

      {view === 'shop-plans' && (
        <section className="grid gap-4 lg:grid-cols-3">
          {[
            { name: 'Bronze HDHP', premium: '$279.42/mo', badge: 'Lowest Premium' },
            { name: 'Silver HMO', premium: '$338.91/mo', badge: 'Best Value' },
            { name: 'Gold PPO', premium: '$412.33/mo', badge: 'Most Popular' }
          ].map((plan) => (
            <article key={plan.name} className="portal-card p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">{plan.badge}</p>
              <h2 className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{plan.name}</h2>
              <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{plan.premium}</p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">Deductible and network details available in comparison view.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/dashboard/billing-enrollment/plans/compare" className="text-sm font-semibold text-[var(--tenant-primary-color)]">Compare</Link>
                <Link href="/dashboard/billing-enrollment/enrollment/start" className="text-sm font-semibold text-[var(--tenant-primary-color)]">Select Plan</Link>
              </div>
            </article>
          ))}
        </section>
      )}

      {view === 'compare-plans' && (
        <section className="portal-card overflow-x-auto p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Plan Comparison</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Premium, deductible, out-of-pocket max, PCP/specialist, pharmacy, and network fit summary.</p>
          <table className="mt-4 min-w-full text-left text-sm">
            <thead className="border-b border-[var(--border-subtle)] text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
              <tr>
                <th className="px-2 py-2">Plan</th>
                <th className="px-2 py-2">Premium</th>
                <th className="px-2 py-2">Deductible</th>
                <th className="px-2 py-2">Out-of-Pocket Max</th>
                <th className="px-2 py-2">PCP / Specialist</th>
                <th className="px-2 py-2">Pharmacy / Rx</th>
                <th className="px-2 py-2">Network Fit</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Bronze HDHP', '$279.42', '$5,500', '$9,200', '$40 / $80', '$20 / $55 / $95', 'Regional network'],
                ['Silver HMO', '$338.91', '$3,000', '$8,600', '$30 / $60', '$15 / $45 / $85', 'Balanced network'],
                ['Gold PPO', '$412.33', '$1,500', '$7,800', '$25 / $50', '$10 / $35 / $70', 'Broad PPO network']
              ].map((row) => (
                <tr key={row[0]} className="border-b border-[var(--border-subtle)]">
                  {row.map((value, i) => (
                    <td key={i} className="px-2 py-3 text-[var(--text-secondary)]">
                      {i === 0 ? <span className="font-semibold text-[var(--text-primary)]">{value}</span> : value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {['renew-coverage', 'report-life-event', 'manage-household', 'verify-eligibility', 'upload-documents', 'status-tracker'].includes(view) && (
        <section className="grid gap-4 xl:grid-cols-2">
          <article className="portal-card p-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Guided Actions</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Plain-language guidance is provided on each step to reduce confusion and improve completion rates.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
              <li className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">Required action 1</li>
              <li className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">Required action 2</li>
            </ul>
          </article>

          <article className="portal-card p-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Contextual Help</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Need help? Each step includes policy and workflow guidance relevant to this stage.
            </p>
            <div className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3 text-sm text-[var(--text-secondary)]">
              Updated {today}. Help content is tenant-aware and follows shared design tokens.
            </div>
          </article>
        </section>
      )}

      {view === 'upload-documents' && (
        <section className="portal-card p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Document Upload</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Upload required files and track verification status.</p>
          <div className="mt-4 rounded-xl border border-dashed border-[var(--border-subtle)] bg-slate-50 px-4 py-6 text-sm text-[var(--text-secondary)]">
            Drag and drop files here or choose a file. Supported formats: PDF, JPG, PNG.
          </div>
        </section>
      )}

      {view === 'status-tracker' && (
        <section>
          <EmptyState
            title="Enrollment Timeline Available"
            description="Detailed status events and correspondence timeline are available in this tracker."
          />
        </section>
      )}
    </div>
  );
}
