'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

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

const flowNavByAudience: Record<
  'individual' | 'legacy',
  Array<{ label: string; href: string; view: EnrollmentView }>
> = {
  individual: [
    { label: 'Shop Plans', href: '/individual/shop-plans', view: 'shop-plans' },
    { label: 'Compare Plans', href: '/individual/shop-plans/compare', view: 'compare-plans' },
    { label: 'Start Enrollment', href: '/individual/my-application', view: 'start-enrollment' },
    { label: 'Renew Coverage', href: '/individual/my-application', view: 'renew-coverage' },
    { label: 'Report Life Event', href: '/individual/my-application', view: 'report-life-event' },
    { label: 'Manage Household', href: '/individual/household', view: 'manage-household' },
    { label: 'Verify Eligibility', href: '/individual/my-application', view: 'verify-eligibility' },
    { label: 'Upload Documents', href: '/individual/documents/upload', view: 'upload-documents' },
    { label: 'Status Tracker', href: '/individual/my-application', view: 'status-tracker' }
  ],
  legacy: [
    { label: 'Shop Plans', href: '/dashboard/billing-enrollment/plans', view: 'shop-plans' },
    { label: 'Compare Plans', href: '/dashboard/billing-enrollment/plans/compare', view: 'compare-plans' },
    { label: 'Start Enrollment', href: '/dashboard/billing-enrollment/enrollment/start', view: 'start-enrollment' },
    { label: 'Renew Coverage', href: '/dashboard/billing-enrollment/renewals', view: 'renew-coverage' },
    { label: 'Report Life Event', href: '/dashboard/billing-enrollment/renewals/life-event', view: 'report-life-event' },
    { label: 'Manage Household', href: '/dashboard/billing-enrollment/enrollment/household', view: 'manage-household' },
    { label: 'Verify Eligibility', href: '/dashboard/billing-enrollment/rules/verify', view: 'verify-eligibility' },
    { label: 'Upload Documents', href: '/dashboard/billing-enrollment/documents/upload', view: 'upload-documents' },
    { label: 'Status Tracker', href: '/dashboard/billing-enrollment/enrollment/status', view: 'status-tracker' }
  ]
};

const enrollmentSteps = [
  { key: 'shop', label: 'Shop Plans', help: 'Review plan premium and network fit.' },
  { key: 'household', label: 'Household Details', help: 'Confirm subscriber and dependent records.' },
  { key: 'eligibility', label: 'Verify Eligibility', help: 'Resolve any pending eligibility checks.' },
  { key: 'documents', label: 'Upload Documents', help: 'Provide all required verification files.' },
  { key: 'submit', label: 'Submit Enrollment', help: 'Submit and monitor pending approval status.' }
];

type PlanOption = {
  id: string;
  name: string;
  premium: string;
  badge: string;
  deductible: string;
  outOfPocketMax: string;
  pcpSpecialist: string;
  pharmacy: string;
  networkFit: string;
  metalTier: string;
  summary: string;
};

const availablePlans: PlanOption[] = [
  {
    id: 'bronze-hdhp',
    name: 'Bronze HDHP',
    premium: '$279.42/mo',
    badge: 'Lowest Premium',
    deductible: '$5,500',
    outOfPocketMax: '$9,200',
    pcpSpecialist: '$40 / $80',
    pharmacy: '$20 / $55 / $95',
    networkFit: 'Regional network',
    metalTier: 'Bronze',
    summary: 'High-deductible option with the lowest monthly premium.'
  },
  {
    id: 'bronze-care',
    name: 'Bronze Select',
    premium: '$301.18/mo',
    badge: 'Budget Pick',
    deductible: '$4,900',
    outOfPocketMax: '$8,900',
    pcpSpecialist: '$35 / $75',
    pharmacy: '$18 / $50 / $92',
    networkFit: 'Value-focused network',
    metalTier: 'Bronze',
    summary: 'Balanced bronze option with modest upfront savings.'
  },
  {
    id: 'silver-hmo',
    name: 'Silver HMO',
    premium: '$338.91/mo',
    badge: 'Best Value',
    deductible: '$3,000',
    outOfPocketMax: '$8,600',
    pcpSpecialist: '$30 / $60',
    pharmacy: '$15 / $45 / $85',
    networkFit: 'Balanced network',
    metalTier: 'Silver',
    summary: 'Strong value plan for predictable primary and routine care.'
  },
  {
    id: 'silver-plus',
    name: 'Silver Plus PPO',
    premium: '$362.74/mo',
    badge: 'Flexible Access',
    deductible: '$2,400',
    outOfPocketMax: '$8,200',
    pcpSpecialist: '$25 / $55',
    pharmacy: '$12 / $40 / $80',
    networkFit: 'Expanded PPO network',
    metalTier: 'Silver',
    summary: 'Added provider flexibility with moderate monthly premium.'
  },
  {
    id: 'gold-ppo',
    name: 'Gold PPO',
    premium: '$412.33/mo',
    badge: 'Most Popular',
    deductible: '$1,500',
    outOfPocketMax: '$7,800',
    pcpSpecialist: '$25 / $50',
    pharmacy: '$10 / $35 / $70',
    networkFit: 'Broad PPO network',
    metalTier: 'Gold',
    summary: 'Popular higher-value option with lower cost sharing.'
  },
  {
    id: 'gold-complete',
    name: 'Gold Complete',
    premium: '$451.62/mo',
    badge: 'Lower Deductible',
    deductible: '$950',
    outOfPocketMax: '$7,100',
    pcpSpecialist: '$20 / $45',
    pharmacy: '$10 / $30 / $60',
    networkFit: 'Broad network plus virtual care',
    metalTier: 'Gold',
    summary: 'Lower deductible plan with strong day-to-day predictability.'
  },
  {
    id: 'platinum-choice',
    name: 'Platinum Choice',
    premium: '$519.08/mo',
    badge: 'Highest Coverage',
    deductible: '$250',
    outOfPocketMax: '$5,900',
    pcpSpecialist: '$15 / $35',
    pharmacy: '$8 / $25 / $50',
    networkFit: 'Premier PPO network',
    metalTier: 'Platinum',
    summary: 'Highest monthly premium with the lowest member cost sharing.'
  }
];

function parseSelectedPlanIds(value: string | null, fallback: string[] = []) {
  if (!value) {
    return fallback;
  }

  const requestedIds = value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  const availableIds = new Set(availablePlans.map((plan) => plan.id));

  return requestedIds.filter((item, index) => availableIds.has(item) && requestedIds.indexOf(item) === index);
}

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
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>(() =>
    parseSelectedPlanIds(
      null,
      view === 'compare-plans'
        ? availablePlans.slice(0, 3).map((plan) => plan.id)
        : []
    )
  );
  const today = new Date().toLocaleDateString();
  const audienceKey =
    pathname === '/individual' || pathname.startsWith('/individual/')
      ? 'individual'
      : 'legacy';
  const flowNav = flowNavByAudience[audienceKey];
  const comparePath =
    audienceKey === 'individual'
      ? '/individual/shop-plans/compare'
      : '/dashboard/billing-enrollment/plans/compare';
  const enrollmentStartPath =
    audienceKey === 'individual'
      ? '/individual/my-application'
      : '/dashboard/billing-enrollment/enrollment/start';

  useEffect(() => {
    const fallback =
      view === 'compare-plans'
        ? availablePlans.slice(0, 3).map((plan) => plan.id)
        : [];
    setSelectedPlanIds(parseSelectedPlanIds(searchParams.get('plans'), fallback));
  }, [searchParams, view]);

  const selectedPlans = useMemo(() => {
    if (selectedPlanIds.length === 0) {
      return [];
    }

    const selectedIdSet = new Set(selectedPlanIds);
    return availablePlans.filter((plan) => selectedIdSet.has(plan.id));
  }, [selectedPlanIds]);

  function togglePlanSelection(planId: string) {
    setSelectedPlanIds((current) =>
      current.includes(planId)
        ? current.filter((id) => id !== planId)
        : [...current, planId]
    );
  }

  function goToCompare(planIds = selectedPlanIds) {
    const nextSelection = planIds.length > 0
      ? planIds
      : availablePlans.slice(0, 3).map((plan) => plan.id);
    const params = new URLSearchParams();
    params.set('plans', nextSelection.join(','));
    router.push(`${comparePath}?${params.toString()}`);
  }

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
        <section className="space-y-4">
          <article className="portal-card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Plan selection</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Choose any number of plans to compare side by side.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-full border border-[var(--border-subtle)] bg-slate-50 px-4 py-2 text-sm font-semibold text-[var(--text-primary)]">
                {selectedPlanIds.length} selected
              </div>
              <button
                type="button"
                onClick={() => goToCompare()}
                className="inline-flex min-h-10 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-4 py-2 text-sm font-semibold text-white"
              >
                Compare selected plans
              </button>
            </div>
          </article>

          <section className="grid gap-4 lg:grid-cols-3">
            {availablePlans.map((plan) => {
              const isSelected = selectedPlanIds.includes(plan.id);

              return (
                <article key={plan.id} className="portal-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">{plan.badge}</p>
                      <h2 className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{plan.name}</h2>
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--tenant-primary-color)]">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => togglePlanSelection(plan.id)}
                        className="h-4 w-4 rounded border-[var(--border-subtle)]"
                      />
                      Compare
                    </label>
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{plan.premium}</p>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">{plan.summary}</p>
                  <dl className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
                    <div className="flex items-center justify-between gap-3">
                      <dt>Tier</dt>
                      <dd className="font-semibold text-[var(--text-primary)]">{plan.metalTier}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt>Deductible</dt>
                      <dd className="font-semibold text-[var(--text-primary)]">{plan.deductible}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt>Network</dt>
                      <dd className="font-semibold text-[var(--text-primary)]">{plan.networkFit}</dd>
                    </div>
                  </dl>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const nextSelection = isSelected
                          ? selectedPlanIds
                          : [...selectedPlanIds, plan.id];
                        if (!isSelected) {
                          setSelectedPlanIds(nextSelection);
                        }
                        goToCompare(nextSelection);
                      }}
                      className="text-sm font-semibold text-[var(--tenant-primary-color)]"
                    >
                      Compare
                    </button>
                    <Link href={enrollmentStartPath} className="text-sm font-semibold text-[var(--tenant-primary-color)]">Select Plan</Link>
                  </div>
                </article>
              );
            })}
          </section>
        </section>
      )}

      {view === 'compare-plans' && (
        <section className="space-y-4">
          <article className="portal-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Plan Comparison</h2>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Premium, deductible, out-of-pocket max, PCP/specialist, pharmacy, and network fit summary.
                </p>
              </div>
              <div className="rounded-full border border-[var(--border-subtle)] bg-slate-50 px-4 py-2 text-sm font-semibold text-[var(--text-primary)]">
                {selectedPlans.length} plan(s) selected
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {availablePlans.map((plan) => (
                <label
                  key={plan.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">{plan.name}</p>
                    <p className="text-[var(--text-secondary)]">{plan.premium}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedPlanIds.includes(plan.id)}
                    onChange={() => togglePlanSelection(plan.id)}
                    className="h-4 w-4 rounded border-[var(--border-subtle)]"
                  />
                </label>
              ))}
            </div>
          </article>

          {selectedPlans.length > 0 ? (
            <section className="portal-card overflow-x-auto p-5">
              <table className="min-w-full text-left text-sm">
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
                  {selectedPlans.map((plan) => (
                    <tr key={plan.id} className="border-b border-[var(--border-subtle)]">
                      <td className="px-2 py-3">
                        <span className="font-semibold text-[var(--text-primary)]">{plan.name}</span>
                      </td>
                      <td className="px-2 py-3 text-[var(--text-secondary)]">{plan.premium.replace('/mo', '')}</td>
                      <td className="px-2 py-3 text-[var(--text-secondary)]">{plan.deductible}</td>
                      <td className="px-2 py-3 text-[var(--text-secondary)]">{plan.outOfPocketMax}</td>
                      <td className="px-2 py-3 text-[var(--text-secondary)]">{plan.pcpSpecialist}</td>
                      <td className="px-2 py-3 text-[var(--text-secondary)]">{plan.pharmacy}</td>
                      <td className="px-2 py-3 text-[var(--text-secondary)]">{plan.networkFit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ) : (
            <EmptyState
              title="No plans selected"
              description="Choose one or more plans above to build a comparison list."
            />
          )}
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
