'use client';

import { useEffect, useMemo, useState } from 'react';
import { CircleAlert, LoaderCircle, Scale, Search, SlidersHorizontal, Star } from 'lucide-react';

import {
  EmptyState,
  InlineButton,
  PageHeader,
  StatusBadge,
  SurfaceCard
} from '../../portal-ui';
import type {
  EstimateResult,
  EstimateSortBy,
  EstimatorBootstrapPayload,
  EstimateSearchInput,
  SavedEstimateRecord
} from '../../../lib/care-cost-estimator/service';

const sortOptions: Array<{ label: string; value: EstimateSortBy }> = [
  { label: 'Distance', value: 'distance' },
  { label: 'Estimated Member Payment', value: 'memberPayment' },
  { label: 'Allowed Amount', value: 'allowedAmount' },
  { label: 'Provider Rating', value: 'rating' },
  { label: 'Provider Gender', value: 'providerGender' },
  { label: 'Network Tier', value: 'networkTier' },
  { label: 'Specialty', value: 'specialty' },
  { label: 'Facility Type', value: 'facilityType' },
  { label: 'Accepts New Patients', value: 'acceptsNewPatients' },
  { label: 'Telehealth Available', value: 'telehealth' },
  { label: 'Language', value: 'language' },
  { label: 'Hospital Affiliation', value: 'hospitalAffiliation' }
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(value));
}

function MetricCard({
  label,
  value,
  detail
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="portal-card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{value}</p>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">{detail}</p>
    </article>
  );
}

function DetailModal({
  estimate,
  onClose,
  onSave
}: {
  estimate: EstimateResult | null;
  onClose: () => void;
  onSave: (estimate: EstimateResult) => void;
}) {
  if (!estimate) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-900/40" onClick={onClose} aria-label="Close estimate detail" />
      <section className="relative z-10 max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-[var(--border-subtle)] bg-white p-6 shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[var(--tenant-primary-color)]">Estimate detail</p>
            <h2 className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{estimate.procedure.name}</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{estimate.provider.name} · {estimate.provider.location}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onSave(estimate)}
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] px-4 py-2 text-sm font-semibold text-[var(--tenant-primary-color)]"
            >
              Save Estimate
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--border-subtle)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)]"
            >
              Close
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Allowed amount" value={formatCurrency(estimate.estimate.allowedAmount)} detail="Negotiated or mock contracted allowed amount." />
          <MetricCard label="Member estimate" value={formatCurrency(estimate.estimate.memberResponsibility)} detail="Estimated out-of-pocket cost for this service." />
          <MetricCard label="Plan estimate" value={formatCurrency(estimate.estimate.planResponsibility)} detail="Estimated health plan payment." />
          <MetricCard label="Confidence" value={estimate.estimate.confidence} detail="Estimate completeness based on available bundled rate data." />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <SurfaceCard title="Calculation Breakdown" description="Detailed member estimate logic based on current plan and accumulators.">
            <dl className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-[var(--bg-page)] p-4"><dt className="text-xs text-[var(--text-muted)]">Plan name</dt><dd className="mt-1 font-semibold text-[var(--text-primary)]">{estimate.planName}</dd></div>
              <div className="rounded-xl bg-[var(--bg-page)] p-4"><dt className="text-xs text-[var(--text-muted)]">Network status</dt><dd className="mt-1 font-semibold text-[var(--text-primary)]">{estimate.provider.networkTier}</dd></div>
              <div className="rounded-xl bg-[var(--bg-page)] p-4"><dt className="text-xs text-[var(--text-muted)]">Deductible remaining before</dt><dd className="mt-1 font-semibold text-[var(--text-primary)]">{formatCurrency(estimate.calculationBreakdown.deductibleRemainingBefore)}</dd></div>
              <div className="rounded-xl bg-[var(--bg-page)] p-4"><dt className="text-xs text-[var(--text-muted)]">Deductible applied</dt><dd className="mt-1 font-semibold text-[var(--text-primary)]">{formatCurrency(estimate.calculationBreakdown.deductibleApplied)}</dd></div>
              <div className="rounded-xl bg-[var(--bg-page)] p-4"><dt className="text-xs text-[var(--text-muted)]">Copay amount</dt><dd className="mt-1 font-semibold text-[var(--text-primary)]">{formatCurrency(estimate.calculationBreakdown.copayAmount)}</dd></div>
              <div className="rounded-xl bg-[var(--bg-page)] p-4"><dt className="text-xs text-[var(--text-muted)]">Coinsurance applied</dt><dd className="mt-1 font-semibold text-[var(--text-primary)]">{formatCurrency(estimate.calculationBreakdown.coinsuranceAmount)}</dd></div>
              <div className="rounded-xl bg-[var(--bg-page)] p-4"><dt className="text-xs text-[var(--text-muted)]">Updated deductible remaining</dt><dd className="mt-1 font-semibold text-[var(--text-primary)]">{formatCurrency(estimate.estimate.updatedDeductibleRemaining)}</dd></div>
              <div className="rounded-xl bg-[var(--bg-page)] p-4"><dt className="text-xs text-[var(--text-muted)]">Updated OOP maximum remaining</dt><dd className="mt-1 font-semibold text-[var(--text-primary)]">{formatCurrency(estimate.estimate.updatedOopRemaining)}</dd></div>
            </dl>
          </SurfaceCard>

          <SurfaceCard title="Coverage Notes" description="Administrative requirements and pricing notes for this estimate.">
            <div className="space-y-3 text-sm text-[var(--text-secondary)]">
              <div className="rounded-xl bg-[var(--bg-page)] p-4">
                {estimate.priorAuthRequired ? 'Prior authorization may be required.' : 'No prior authorization flag on this procedure.'}
              </div>
              <div className="rounded-xl bg-[var(--bg-page)] p-4">
                {estimate.referralIndicator ? 'Referral or PCP model review may still apply.' : 'No referral flag on this estimate.'}
              </div>
              <div className="rounded-xl bg-[var(--bg-page)] p-4">{estimate.ancillaryServicesNote}</div>
            </div>
          </SurfaceCard>
        </div>

        <SurfaceCard title="Estimate Notes And Disclaimers" description="Use this detail to understand estimate completeness and potential final claim differences.">
          <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
            {estimate.calculationBreakdown.notes.map((note) => (
              <li key={note} className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">{note}</li>
            ))}
          </ul>
        </SurfaceCard>
      </section>
    </div>
  );
}

export function CareCostEstimatorPage({
  initialData
}: {
  initialData: EstimatorBootstrapPayload;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [procedureId, setProcedureId] = useState(initialData.procedures[0]?.id ?? '');
  const [sortBy, setSortBy] = useState<EstimateSortBy>('distance');
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [inNetworkOnly, setInNetworkOnly] = useState(true);
  const [providerGender, setProviderGender] = useState('All');
  const [specialty, setSpecialty] = useState('All');
  const [facilityType, setFacilityType] = useState('All');
  const [ratingThreshold, setRatingThreshold] = useState(0);
  const [distanceRadius, setDistanceRadius] = useState(25);
  const [acceptsNewPatients, setAcceptsNewPatients] = useState(false);
  const [telehealth, setTelehealth] = useState(false);
  const [language, setLanguage] = useState('All');
  const [networkTier, setNetworkTier] = useState('All');
  const [boardCertified, setBoardCertified] = useState(false);
  const [eveningWeekendAvailability, setEveningWeekendAvailability] = useState(false);
  const [accessibilityAccommodations, setAccessibilityAccommodations] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<EstimateResult[]>([]);
  const [selectedEstimate, setSelectedEstimate] = useState<EstimateResult | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [savedEstimates, setSavedEstimates] = useState<SavedEstimateRecord[]>(initialData.savedEstimates);

  const activeProcedure = useMemo(
    () => initialData.procedures.find((item) => item.id === procedureId) ?? initialData.procedures[0],
    [initialData.procedures, procedureId]
  );

  async function runEstimate() {
    setLoading(true);
    setError('');
    try {
      const payload: EstimateSearchInput = {
        memberId: initialData.member.memberId,
        procedureId,
        searchTerm,
        sortBy,
        filters: {
          inNetworkOnly,
          providerGender: providerGender as 'All' | 'Female' | 'Male' | 'Group',
          specialty,
          facilityType,
          ratingThreshold,
          distanceRadius,
          acceptsNewPatients,
          telehealth,
          language,
          networkTier: networkTier as 'All' | 'Tier 1' | 'Tier 2' | 'Out of Network',
          boardCertified,
          eveningWeekendAvailability,
          accessibilityAccommodations
        }
      };

      const response = await fetch('/api/care-cost-estimator/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error('Unable to run estimate.');
      }
      const data = await response.json();
      setResults(data.results ?? []);
      setCompareIds([]);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Unable to load estimate results.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void runEstimate();
  }, []);

  async function saveEstimate(estimate: EstimateResult) {
    const response = await fetch('/api/care-cost-estimator/saved', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estimate })
    });
    if (response.ok) {
      setSavedEstimates(await response.json());
    }
  }

  const compareResults = results.filter((result) => compareIds.includes(result.estimate.id));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Care Cost Estimator"
        title="Estimate your healthcare costs before you schedule care"
        description="Search for a procedure, compare providers, and see your personalized out-of-pocket estimate using your current plan benefits and accumulators."
        actions={<InlineButton href="/dashboard/providers" tone="secondary">Find Care</InlineButton>}
      />

      <div className="grid gap-4 xl:grid-cols-4">
        <MetricCard label="Plan" value={initialData.plan.name} detail={initialData.plan.description} />
        <MetricCard label="Deductible Remaining" value={formatCurrency(initialData.accumulator.deductibleRemaining)} detail={`${formatCurrency(initialData.accumulator.deductibleTotal)} annual deductible`} />
        <MetricCard label="OOP Maximum Remaining" value={formatCurrency(initialData.accumulator.oopRemaining)} detail={`${formatCurrency(initialData.accumulator.oopTotal)} annual out-of-pocket max`} />
        <MetricCard label="Referral Model" value={initialData.member.referralRequired ? 'PCP / Referral' : 'Open Access'} detail={`Member ID ${initialData.member.memberId} · PCP ${initialData.member.pcpName}`} />
      </div>

      <SurfaceCard
        title="Search And Estimate"
        description="Search by plain-English procedure, CPT/HCPCS code, provider, specialty, or facility name."
        action={
          <button
            type="button"
            onClick={() => setFiltersOpen((value) => !value)}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[var(--border-subtle)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)]"
          >
            <SlidersHorizontal size={16} />
            {filtersOpen ? 'Hide Filters' : 'Show Filters'}
          </button>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr_200px]">
            <label className="text-sm text-[var(--text-secondary)]">
              <span className="mb-1 block font-medium text-[var(--text-primary)]">Procedure or provider search</span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                <input
                  className="portal-input pl-10 pr-4 text-sm"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Try MRI knee, 73721, Olivia Hart, Orthopedics, or Lakeside Imaging"
                  list="care-cost-estimator-typeahead"
                />
                <datalist id="care-cost-estimator-typeahead">
                  {initialData.procedures.map((procedure) => (
                    <option key={procedure.id} value={procedure.plainEnglish} />
                  ))}
                  {initialData.providers.map((provider) => (
                    <option key={provider.id} value={provider.name} />
                  ))}
                </datalist>
              </div>
            </label>
            <label className="text-sm text-[var(--text-secondary)]">
              <span className="mb-1 block font-medium text-[var(--text-primary)]">Selected service</span>
              <select className="portal-input px-3 py-2 text-sm" value={procedureId} onChange={(event) => setProcedureId(event.target.value)}>
                {initialData.procedures.map((procedure) => (
                  <option key={procedure.id} value={procedure.id}>
                    {procedure.name} · {procedure.code}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => void runEstimate()}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-5 py-3 text-sm font-semibold text-white"
              >
                Run Estimate
              </button>
            </div>
          </div>

          {filtersOpen ? (
            <div className="grid gap-4 border-t border-[var(--border-subtle)] pt-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"><input type="checkbox" checked={inNetworkOnly} onChange={(event) => setInNetworkOnly(event.target.checked)} />In-network only</label>
              <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"><input type="checkbox" checked={acceptsNewPatients} onChange={(event) => setAcceptsNewPatients(event.target.checked)} />Accepts new patients</label>
              <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"><input type="checkbox" checked={telehealth} onChange={(event) => setTelehealth(event.target.checked)} />Telehealth available</label>
              <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"><input type="checkbox" checked={boardCertified} onChange={(event) => setBoardCertified(event.target.checked)} />Board certified</label>
              <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"><input type="checkbox" checked={eveningWeekendAvailability} onChange={(event) => setEveningWeekendAvailability(event.target.checked)} />Evening / weekend availability</label>
              <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"><input type="checkbox" checked={accessibilityAccommodations} onChange={(event) => setAccessibilityAccommodations(event.target.checked)} />Accessibility accommodations</label>
              <label className="text-sm text-[var(--text-secondary)]"><span className="mb-1 block font-medium text-[var(--text-primary)]">Provider gender</span><select className="portal-input px-3 py-2 text-sm" value={providerGender} onChange={(event) => setProviderGender(event.target.value)}><option>All</option><option>Female</option><option>Male</option><option>Group</option></select></label>
              <label className="text-sm text-[var(--text-secondary)]"><span className="mb-1 block font-medium text-[var(--text-primary)]">Specialty</span><select className="portal-input px-3 py-2 text-sm" value={specialty} onChange={(event) => setSpecialty(event.target.value)}>{initialData.specialties.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label className="text-sm text-[var(--text-secondary)]"><span className="mb-1 block font-medium text-[var(--text-primary)]">Facility type</span><select className="portal-input px-3 py-2 text-sm" value={facilityType} onChange={(event) => setFacilityType(event.target.value)}>{initialData.facilityTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label className="text-sm text-[var(--text-secondary)]"><span className="mb-1 block font-medium text-[var(--text-primary)]">Language</span><select className="portal-input px-3 py-2 text-sm" value={language} onChange={(event) => setLanguage(event.target.value)}>{initialData.languages.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label className="text-sm text-[var(--text-secondary)]"><span className="mb-1 block font-medium text-[var(--text-primary)]">Network tier</span><select className="portal-input px-3 py-2 text-sm" value={networkTier} onChange={(event) => setNetworkTier(event.target.value)}><option>All</option><option>Tier 1</option><option>Tier 2</option><option>Out of Network</option></select></label>
              <label className="text-sm text-[var(--text-secondary)]"><span className="mb-1 block font-medium text-[var(--text-primary)]">Rating threshold</span><select className="portal-input px-3 py-2 text-sm" value={String(ratingThreshold)} onChange={(event) => setRatingThreshold(Number(event.target.value))}><option value="0">All ratings</option><option value="4">4.0+</option><option value="4.5">4.5+</option></select></label>
              <label className="text-sm text-[var(--text-secondary)]"><span className="mb-1 block font-medium text-[var(--text-primary)]">Distance radius</span><select className="portal-input px-3 py-2 text-sm" value={String(distanceRadius)} onChange={(event) => setDistanceRadius(Number(event.target.value))}><option value="10">10 miles</option><option value="25">25 miles</option><option value="50">50 miles</option></select></label>
              <label className="text-sm text-[var(--text-secondary)]"><span className="mb-1 block font-medium text-[var(--text-primary)]">Sort results by</span><select className="portal-input px-3 py-2 text-sm" value={sortBy} onChange={(event) => setSortBy(event.target.value as EstimateSortBy)}>{sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            </div>
          ) : null}
        </div>
      </SurfaceCard>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <SurfaceCard
            title={`Provider estimates for ${activeProcedure?.name ?? 'selected service'}`}
            description="Compare total allowed amount, member responsibility, plan payment, and provider quality side by side."
          >
            {loading ? (
              <div className="flex items-center justify-center rounded-2xl border border-dashed border-[var(--border-subtle)] bg-slate-50 px-4 py-10 text-sm text-[var(--text-secondary)]">
                <LoaderCircle className="mr-2 animate-spin" size={18} />
                Running estimate...
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
            ) : results.length === 0 ? (
              <EmptyState title="No matching estimates found" description="Try broadening your filters or selecting a different procedure." />
            ) : (
              <div className="space-y-4">
                {results.map((result) => {
                  const compareSelected = compareIds.includes(result.estimate.id);
                  return (
                    <article key={result.estimate.id} className="rounded-2xl border border-[var(--border-subtle)] bg-white p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-[var(--text-primary)]">{result.provider.name}</h3>
                            {result.bestValue ? <StatusBadge label="Best value" /> : null}
                            <StatusBadge label={result.provider.networkTier} />
                          </div>
                          <p className="mt-1 text-sm text-[var(--text-secondary)]">
                            {result.provider.specialty} · {result.provider.facilityType} · {result.provider.distanceMiles.toFixed(1)} miles
                          </p>
                          <p className="mt-1 text-sm text-[var(--text-secondary)]">
                            {result.provider.gender} · {result.provider.hospitalAffiliation} · {result.provider.languages.join(', ')}
                          </p>
                        </div>
                        <div className="grid min-w-[240px] gap-2 sm:grid-cols-3">
                          <div className="rounded-xl bg-[var(--bg-page)] p-3"><p className="text-xs text-[var(--text-muted)]">Member estimate</p><p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{formatCurrency(result.estimate.memberResponsibility)}</p></div>
                          <div className="rounded-xl bg-[var(--bg-page)] p-3"><p className="text-xs text-[var(--text-muted)]">Plan payment</p><p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{formatCurrency(result.estimate.planResponsibility)}</p></div>
                          <div className="rounded-xl bg-[var(--bg-page)] p-3"><p className="text-xs text-[var(--text-muted)]">Allowed amount</p><p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{formatCurrency(result.estimate.allowedAmount)}</p></div>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                        <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-3 py-3 text-sm text-[var(--text-secondary)]"><strong className="text-[var(--text-primary)]">{result.quality.rating.toFixed(1)}</strong> rating</div>
                        <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-3 py-3 text-sm text-[var(--text-secondary)]">{result.provider.acceptsNewPatients ? 'Accepts new patients' : 'Call to confirm availability'}</div>
                        <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-3 py-3 text-sm text-[var(--text-secondary)]">{result.provider.telehealthAvailable ? 'Telehealth available' : 'In-person only'}</div>
                        <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-3 py-3 text-sm text-[var(--text-secondary)]">{result.priorAuthRequired ? 'Prior auth may apply' : 'No prior auth flag'}</div>
                        <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-3 py-3 text-sm text-[var(--text-secondary)]">{result.referralIndicator ? 'Referral model review' : 'No referral flag'}</div>
                      </div>

                      <p className="mt-4 text-sm text-[var(--text-secondary)]">{result.ancillaryServicesNote}</p>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                          <input
                            type="checkbox"
                            checked={compareSelected}
                            disabled={!compareSelected && compareIds.length >= 4}
                            onChange={(event) => {
                              if (event.target.checked) {
                                setCompareIds((current) => [...current, result.estimate.id].slice(0, 4));
                              } else {
                                setCompareIds((current) => current.filter((item) => item !== result.estimate.id));
                              }
                            }}
                          />
                          Compare
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => setSelectedEstimate(result)} className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] px-4 py-2 text-sm font-semibold text-[var(--tenant-primary-color)]">
                            View Details
                          </button>
                          <button type="button" onClick={() => void saveEstimate(result)} className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--border-subtle)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)]">
                            Save Estimate
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </SurfaceCard>

          {compareResults.length ? (
            <SurfaceCard title="Compare Providers" description="Side-by-side comparison for up to four provider or facility options.">
              <div className="overflow-x-auto">
                <table className="portal-data-table min-w-[900px] w-full border-collapse bg-white text-sm">
                  <thead>
                    <tr className="text-left text-[var(--text-muted)]">
                      <th className="px-4 py-3 font-medium">Attribute</th>
                      {compareResults.map((result) => (
                        <th key={result.estimate.id} className="px-4 py-3 font-medium">{result.provider.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Distance', (item: EstimateResult) => `${item.provider.distanceMiles.toFixed(1)} miles`],
                      ['Rating', (item: EstimateResult) => `${item.quality.rating.toFixed(1)} / 5`],
                      ['Allowed amount', (item: EstimateResult) => formatCurrency(item.estimate.allowedAmount)],
                      ['Estimated member payment', (item: EstimateResult) => formatCurrency(item.estimate.memberResponsibility)],
                      ['Estimated plan payment', (item: EstimateResult) => formatCurrency(item.estimate.planResponsibility)],
                      ['Network tier', (item: EstimateResult) => item.provider.networkTier],
                      ['Facility type', (item: EstimateResult) => item.provider.facilityType],
                      ['Gender', (item: EstimateResult) => item.provider.gender],
                      ['Telehealth', (item: EstimateResult) => item.provider.telehealthAvailable ? 'Yes' : 'No'],
                      ['Accepts new patients', (item: EstimateResult) => item.provider.acceptsNewPatients ? 'Yes' : 'No']
                    ].map(([label, getter]) => (
                      <tr key={label as string} className="border-t border-[var(--border-subtle)]">
                        <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">{label as string}</td>
                        {compareResults.map((result) => (
                          <td key={`${result.estimate.id}-${label as string}`} className="px-4 py-3 text-[var(--text-secondary)]">{(getter as (item: EstimateResult) => string)(result)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SurfaceCard>
          ) : null}
        </div>

        <div className="space-y-4">
          <SurfaceCard title="Saved Estimates" description="Return to estimates you want to review later or share with your family.">
            {savedEstimates.length ? (
              <div className="space-y-3">
                {savedEstimates.map((saved) => (
                  <article key={saved.id} className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
                    <p className="font-semibold text-[var(--text-primary)]">{saved.procedureName}</p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">{saved.providerName}</p>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">Member estimate {formatCurrency(saved.memberResponsibility)}</p>
                    <p className="text-xs text-[var(--text-muted)]">Saved {formatDate(saved.generatedAt)}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-secondary)]">No saved estimates yet.</p>
            )}
          </SurfaceCard>

          <SurfaceCard title="Estimate Guidance" description="Key plan-aware context used for your estimate.">
            <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
              <li className="rounded-xl bg-[var(--bg-page)] p-4">Current product: {initialData.member.product}</li>
              <li className="rounded-xl bg-[var(--bg-page)] p-4">Network tier eligibility: {initialData.member.networkTierEligible.join(', ')}</li>
              <li className="rounded-xl bg-[var(--bg-page)] p-4">Referral model: {initialData.member.referralRequired ? 'Referral-sensitive plan' : 'Open access plan'}</li>
            </ul>
          </SurfaceCard>

          <SurfaceCard title="Disclaimers" description="Important estimate limitations and payment notes.">
            <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
              {initialData.disclaimer.map((item) => (
                <li key={item} className="rounded-xl bg-[var(--bg-page)] p-4">{item}</li>
              ))}
            </ul>
          </SurfaceCard>
        </div>
      </div>

      <SurfaceCard title="Shopping Tips" description="Payer-grade shopping support to help you balance cost, quality, and convenience.">
        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl bg-[var(--bg-page)] p-5">
            <div className="flex items-center gap-2 text-[var(--tenant-primary-color)]"><Scale size={18} /><span className="font-semibold">Compare value</span></div>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Use compare mode to review quality scores, member cost, and network tier side by side.</p>
          </article>
          <article className="rounded-2xl bg-[var(--bg-page)] p-5">
            <div className="flex items-center gap-2 text-[var(--tenant-primary-color)]"><Star size={18} /><span className="font-semibold">Look for best value</span></div>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Best value badges highlight lower member cost paired with stronger quality ratings.</p>
          </article>
          <article className="rounded-2xl bg-[var(--bg-page)] p-5">
            <div className="flex items-center gap-2 text-[var(--tenant-primary-color)]"><CircleAlert size={18} /><span className="font-semibold">Check requirements</span></div>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Prior auth, referrals, and ancillary services can still affect your final claim and payment.</p>
          </article>
        </div>
      </SurfaceCard>

      <DetailModal estimate={selectedEstimate} onClose={() => setSelectedEstimate(null)} onSave={saveEstimate} />
    </div>
  );
}
