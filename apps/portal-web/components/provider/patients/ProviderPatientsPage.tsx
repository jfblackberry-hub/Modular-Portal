'use client';

import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal, UserRound, Sparkles, ClipboardList, X } from 'lucide-react';

import type { ProviderPortalConfig } from '../../../config/providerPortalConfig';
import { EmptyState, PageHeader, StatusBadge, SurfaceCard } from '../../portal-ui';
import { ProviderMetricsRow } from '../dashboard/ProviderMetricsRow';
import {
  patientRecentSearches,
  patientSavedFilters,
  providerPatients,
  type ProviderPatientRecord
} from './provider-patients-data';

type DirectoryTab = 'all' | 'programs' | 'signals';

type FiltersState = {
  status: 'All' | 'Active' | 'Inactive';
  programEnrollment: 'All' | 'Enrolled' | 'Referred' | 'Outreach in progress' | 'Completed' | 'Declined';
  riskLevel: 'All' | 'Low' | 'Moderate' | 'High' | 'Rising';
  careGapStatus: 'All' | 'Open gaps' | 'No open gaps';
  recentUtilization: 'All' | 'ED visit' | 'Inpatient discharge';
  pgxStatus: 'All' | 'Available' | 'Pending' | 'Not Ordered';
  payerLine: 'All' | 'Commercial PPO' | 'Commercial HMO' | 'Marketplace Silver' | 'Medicare Advantage';
  lastVisitFrom: string;
  lastVisitTo: string;
  sortBy: 'lastName' | 'lastActivity' | 'risk' | 'programParticipation';
};

const defaultFilters: FiltersState = {
  status: 'All',
  programEnrollment: 'All',
  riskLevel: 'All',
  careGapStatus: 'All',
  recentUtilization: 'All',
  pgxStatus: 'All',
  payerLine: 'All',
  lastVisitFrom: '',
  lastVisitTo: '',
  sortBy: 'lastActivity'
};

const riskRank = { High: 4, Rising: 3, Moderate: 2, Low: 1 };

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

function matchesSearch(record: ProviderPatientRecord, query: string) {
  if (!query.trim()) return true;

  const haystack = [
    record.patientName,
    record.memberId,
    record.dob,
    record.phone,
    record.claimNumber ?? '',
    record.authorizationNumber ?? '',
    record.pcp,
    record.assignedProvider,
    record.planId,
    record.alternateId,
    record.specialPrograms.map((program) => program.programName).join(' ')
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(query.trim().toLowerCase());
}

function getFilteredPatients(query: string, filters: FiltersState) {
  return providerPatients
    .filter((record) => matchesSearch(record, query))
    .filter((record) => filters.status === 'All' || record.status === filters.status)
    .filter(
      (record) =>
        filters.programEnrollment === 'All' ||
        record.specialPrograms.some((program) => program.status === filters.programEnrollment)
    )
    .filter((record) => filters.riskLevel === 'All' || record.riskLevel === filters.riskLevel)
    .filter((record) => {
      if (filters.careGapStatus === 'Open gaps') return record.openCareGaps > 0;
      if (filters.careGapStatus === 'No open gaps') return record.openCareGaps === 0;
      return true;
    })
    .filter((record) => {
      if (filters.recentUtilization === 'All') return true;
      return record.recentFlags.includes(filters.recentUtilization);
    })
    .filter((record) => filters.pgxStatus === 'All' || record.supplementalData.pgx.status === filters.pgxStatus)
    .filter((record) => filters.payerLine === 'All' || record.productLine === filters.payerLine)
    .filter((record) => !filters.lastVisitFrom || record.lastVisitDate >= filters.lastVisitFrom)
    .filter((record) => !filters.lastVisitTo || record.lastVisitDate <= filters.lastVisitTo)
    .sort((left, right) => {
      switch (filters.sortBy) {
        case 'lastName':
          return left.patientName.localeCompare(right.patientName);
        case 'risk':
          return riskRank[right.riskLevel] - riskRank[left.riskLevel];
        case 'programParticipation':
          return right.specialPrograms.length - left.specialPrograms.length;
        case 'lastActivity':
        default:
          return right.lastActivityDate.localeCompare(left.lastActivityDate);
      }
    });
}

function applySavedFilter(id: string, setQuery: (value: string) => void, setFilters: (value: FiltersState) => void) {
  if (id === 'high-risk') {
    setQuery('');
    setFilters({ ...defaultFilters, riskLevel: 'High' });
    return;
  }

  if (id === 'programs') {
    setQuery('');
    setFilters({ ...defaultFilters, programEnrollment: 'Enrolled' });
    return;
  }

  if (id === 'pgx') {
    setQuery('');
    setFilters({ ...defaultFilters, pgxStatus: 'Available' });
    return;
  }

  setQuery('');
  setFilters({ ...defaultFilters, careGapStatus: 'Open gaps' });
}

function getMetrics(records: ProviderPatientRecord[]) {
  return [
    {
      label: 'Total Attributed Patients',
      value: String(records.length),
      trend: `${records.filter((record) => record.status === 'Active').length} active`
    },
    {
      label: 'Active High-Risk Patients',
      value: String(records.filter((record) => record.status === 'Active' && record.riskLevel === 'High').length),
      trend: `${records.filter((record) => record.recentFlags.length > 0).length} with recent utilization flags`
    },
    {
      label: 'Patients In Special Programs',
      value: String(records.filter((record) => record.specialPrograms.length > 0).length),
      trend: `${records.reduce((sum, record) => sum + record.specialPrograms.length, 0)} active program records`
    },
    {
      label: 'Patients With Open Care Gaps',
      value: String(records.filter((record) => record.openCareGaps > 0).length),
      trend: `${records.reduce((sum, record) => sum + record.openCareGaps, 0)} gaps requiring action`
    }
  ];
}

function DataPoint({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border border-[var(--border-subtle)] bg-slate-50/80 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{value}</p>
    </article>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm text-[var(--text-secondary)]">
      <span className="mb-1 block font-medium text-[var(--text-primary)]">{label}</span>
      <select className="portal-input px-3 py-2 text-sm" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function PatientDetailDrawer({
  patient,
  onClose
}: {
  patient: ProviderPatientRecord | null;
  onClose: () => void;
}) {
  if (!patient) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/35 modal-fade-in"
        aria-label="Close patient detail"
        onClick={onClose}
      />
      <aside className="modal-scale-in absolute right-0 top-0 h-full w-full max-w-[760px] overflow-y-auto border-l border-[var(--border-subtle)] bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[var(--tenant-primary-color)]">Patient detail</p>
            <h2 className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{patient.patientName}</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {patient.memberId} · DOB {formatDate(patient.dob)} · {patient.phone}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-subtle)] text-[var(--text-secondary)]"
            aria-label="Close patient detail drawer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <DataPoint label="Coverage" value={patient.coverageSnapshot} />
          <DataPoint label="Risk" value={patient.riskLevel} />
          <DataPoint label="Last visit" value={formatDate(patient.lastVisitDate)} />
          <DataPoint label="Open care gaps" value={String(patient.openCareGaps)} />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <SurfaceCard title="Demographic Summary" description="Provider-attributed member identity and coverage data.">
            <div className="grid gap-3 sm:grid-cols-2">
              <DataPoint label="Plan ID" value={patient.planId} />
              <DataPoint label="Alternate ID" value={patient.alternateId} />
              <DataPoint label="Payer" value={`${patient.payer} · ${patient.productLine}`} />
              <DataPoint label="Assigned PCP" value={patient.pcp} />
            </div>
          </SurfaceCard>

          <SurfaceCard title="Care Team" description="Provider office and payer-supported contacts.">
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              {patient.careTeam.map((member) => (
                <li key={member} className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
                  {member}
                </li>
              ))}
            </ul>
          </SurfaceCard>

          <SurfaceCard title="Active Conditions / Flags" description="Current clinical conditions and operational alerts.">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {patient.activeConditions.map((condition) => (
                  <span
                    key={condition}
                    className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                  >
                    {condition}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {patient.recentFlags.length ? patient.recentFlags.map((flag) => <StatusBadge key={flag} label={flag} />) : <p className="text-sm text-[var(--text-secondary)]">No recent acute utilization flags.</p>}
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard title="Utilization And Medications" description="Recent utilization and current medication summary.">
            <div className="space-y-3 text-sm text-[var(--text-secondary)]">
              <p>{patient.supplementalData.utilizationSummary}</p>
              <ul className="space-y-2">
                {patient.medicationsSummary.map((medication) => (
                  <li key={medication} className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
                    {medication}
                  </li>
                ))}
              </ul>
            </div>
          </SurfaceCard>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <SurfaceCard title="Special Programs" description="Operational program visibility for provider follow-up.">
            <div className="space-y-3">
              {patient.specialPrograms.map((program) => (
                <article key={program.id} className="rounded-xl border border-[var(--border-subtle)] bg-slate-50/80 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">{program.programName}</h3>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">{program.notesPreview}</p>
                    </div>
                    <StatusBadge label={program.status} />
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <DataPoint label="Effective date" value={formatDate(program.effectiveDate)} />
                    <DataPoint label="Referring entity" value={program.referringEntity} />
                    <DataPoint label="Next action due" value={formatDate(program.nextActionDue)} />
                  </div>
                </article>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard title="PGx And Plan Data" description="Plan-sourced awareness data surfaced for office action.">
            <div className="space-y-3 text-sm text-[var(--text-secondary)]">
              <StatusBadge label={`PGx ${patient.supplementalData.pgx.status}`} />
              <p>{patient.supplementalData.pgx.considerationSummary}</p>
              <DataPoint label="Alert level" value={patient.supplementalData.pgx.alertLevel} />
              <DataPoint label="Source" value={patient.supplementalData.pgx.source} />
              <DataPoint label="Care management" value={patient.supplementalData.careManagementSummary} />
              <p className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3 text-xs text-[var(--text-muted)]">
                {patient.supplementalData.pgx.disclaimer}
              </p>
            </div>
          </SurfaceCard>
        </div>

        <SurfaceCard title="Notes And Activity Timeline" description="Recent plan and provider activity on the patient record.">
          <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
            {patient.notesTimeline.map((note) => (
              <li key={note.id} className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
                <p className="font-semibold text-[var(--text-primary)]">{formatDate(note.date)}</p>
                <p className="mt-1">{note.note}</p>
              </li>
            ))}
          </ul>
        </SurfaceCard>
      </aside>
    </div>
  );
}

function PatientsResultsTable({
  records,
  onViewPatient
}: {
  records: ProviderPatientRecord[];
  onViewPatient: (record: ProviderPatientRecord) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)]">
      <div className="overflow-x-auto">
        <table className="portal-data-table min-w-[1100px] w-full border-collapse bg-white text-sm">
          <thead>
            <tr className="text-left text-[var(--text-muted)]">
              <th className="px-4 py-3 font-medium">Patient</th>
              <th className="px-4 py-3 font-medium">Member ID</th>
              <th className="px-4 py-3 font-medium">DOB</th>
              <th className="px-4 py-3 font-medium">Assigned Provider</th>
              <th className="px-4 py-3 font-medium">Risk</th>
              <th className="px-4 py-3 font-medium">Special Programs</th>
              <th className="px-4 py-3 font-medium">Care Gaps</th>
              <th className="px-4 py-3 font-medium">PGx</th>
              <th className="px-4 py-3 font-medium">Last Interaction</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id} className="border-t border-[var(--border-subtle)] align-top hover:bg-slate-50/60">
                <td className="px-4 py-3">
                  <button type="button" className="text-left" onClick={() => onViewPatient(record)}>
                    <p className="font-semibold text-[var(--text-primary)]">{record.patientName}</p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">{record.status} · {record.phone}</p>
                  </button>
                </td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{record.memberId}</td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{formatDate(record.dob)}</td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{record.assignedProvider}</td>
                <td className="px-4 py-3"><StatusBadge label={record.riskLevel} /></td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">
                  {record.specialPrograms.length ? record.specialPrograms.map((program) => program.programName).join(', ') : 'None'}
                </td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{record.openCareGaps}</td>
                <td className="px-4 py-3"><StatusBadge label={record.supplementalData.pgx.status} /></td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{formatDate(record.lastActivityDate)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onViewPatient(record)}
                      className="inline-flex min-h-9 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] px-3 py-2 text-xs font-semibold text-[var(--tenant-primary-color)]"
                    >
                      View Patient
                    </button>
                    <button
                      type="button"
                      onClick={() => onViewPatient(record)}
                      className="inline-flex min-h-9 items-center justify-center rounded-full border border-[var(--border-subtle)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)]"
                    >
                      View Programs
                    </button>
                    <button
                      type="button"
                      onClick={() => onViewPatient(record)}
                      className="inline-flex min-h-9 items-center justify-center rounded-full border border-[var(--border-subtle)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)]"
                    >
                      Additional Data
                    </button>
                    <button
                      type="button"
                      onClick={() => onViewPatient(record)}
                      className="inline-flex min-h-9 items-center justify-center rounded-full border border-[var(--border-subtle)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)]"
                    >
                      Flag Follow-Up
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ProviderPatientsPage({ config }: { config: ProviderPortalConfig }) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<FiltersState>(defaultFilters);
  const [activeTab, setActiveTab] = useState<DirectoryTab>('all');
  const [advancedOpen, setAdvancedOpen] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<ProviderPatientRecord | null>(providerPatients[0] ?? null);
  const [detailPatient, setDetailPatient] = useState<ProviderPatientRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const filteredPatients = getFilteredPatients(query, filters);
  const summaryMetrics = getMetrics(providerPatients);
  const programPatients = filteredPatients.filter((record) => record.specialPrograms.length > 0);
  const pgxPatients = filteredPatients.filter((record) => record.supplementalData.pgx.status !== 'Not Ordered');

  useEffect(() => {
    setIsLoading(true);
    const timer = window.setTimeout(() => setIsLoading(false), 180);
    return () => window.clearTimeout(timer);
  }, [query, filters, activeTab]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={config.displayName}
        title="Patients"
        description="Search and manage patient records, enrollment indicators, care gaps, and plan-sourced clinical support data in one provider workspace."
      />

      <ProviderMetricsRow metrics={summaryMetrics} />

      <SurfaceCard
        title="Universal Patient Lookup"
        description="Search by patient name, member ID, DOB, phone, claim or authorization number, PCP attribution, plan ID, or alternate identifier."
        action={
          <button
            type="button"
            onClick={() => setAdvancedOpen((value) => !value)}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[var(--border-subtle)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)]"
          >
            <SlidersHorizontal size={16} />
            {advancedOpen ? 'Hide Filters' : 'Show Filters'}
          </button>
        }
      >
        <div className="space-y-4">
          <label className="block">
            <span className="portal-sr-only">Search patients</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="portal-input h-12 rounded-2xl pl-11 pr-4 text-sm"
                placeholder="Try Taylor Morgan, M-48291, 1983-04-17, CLM-100245, PA-100233, or BHH-MI-5538"
              />
            </div>
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Recent searches</span>
            {patientRecentSearches.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setQuery(item)}
                className="rounded-full border border-[var(--border-subtle)] bg-slate-50 px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)]"
              >
                {item}
              </button>
            ))}
          </div>

          {advancedOpen ? (
            <div className="grid gap-4 border-t border-[var(--border-subtle)] pt-4 md:grid-cols-2 xl:grid-cols-5">
              <FilterSelect
                label="Active / Inactive"
                value={filters.status}
                options={['All', 'Active', 'Inactive']}
                onChange={(value) => setFilters({ ...filters, status: value as FiltersState['status'] })}
              />
              <FilterSelect
                label="Program Enrollment"
                value={filters.programEnrollment}
                options={['All', 'Enrolled', 'Referred', 'Outreach in progress', 'Completed', 'Declined']}
                onChange={(value) => setFilters({ ...filters, programEnrollment: value as FiltersState['programEnrollment'] })}
              />
              <FilterSelect
                label="Risk Level"
                value={filters.riskLevel}
                options={['All', 'Low', 'Moderate', 'High', 'Rising']}
                onChange={(value) => setFilters({ ...filters, riskLevel: value as FiltersState['riskLevel'] })}
              />
              <FilterSelect
                label="Care Gap Status"
                value={filters.careGapStatus}
                options={['All', 'Open gaps', 'No open gaps']}
                onChange={(value) => setFilters({ ...filters, careGapStatus: value as FiltersState['careGapStatus'] })}
              />
              <FilterSelect
                label="Recent ED / Inpatient Flags"
                value={filters.recentUtilization}
                options={['All', 'ED visit', 'Inpatient discharge']}
                onChange={(value) => setFilters({ ...filters, recentUtilization: value as FiltersState['recentUtilization'] })}
              />
              <FilterSelect
                label="PGx Data"
                value={filters.pgxStatus}
                options={['All', 'Available', 'Pending', 'Not Ordered']}
                onChange={(value) => setFilters({ ...filters, pgxStatus: value as FiltersState['pgxStatus'] })}
              />
              <FilterSelect
                label="Payer / Product Line"
                value={filters.payerLine}
                options={['All', 'Commercial PPO', 'Commercial HMO', 'Marketplace Silver', 'Medicare Advantage']}
                onChange={(value) => setFilters({ ...filters, payerLine: value as FiltersState['payerLine'] })}
              />
              <label className="text-sm text-[var(--text-secondary)]">
                <span className="mb-1 block font-medium text-[var(--text-primary)]">Last Visit From</span>
                <input
                  type="date"
                  className="portal-input px-3 py-2 text-sm"
                  value={filters.lastVisitFrom}
                  onChange={(event) => setFilters({ ...filters, lastVisitFrom: event.target.value })}
                />
              </label>
              <label className="text-sm text-[var(--text-secondary)]">
                <span className="mb-1 block font-medium text-[var(--text-primary)]">Last Visit To</span>
                <input
                  type="date"
                  className="portal-input px-3 py-2 text-sm"
                  value={filters.lastVisitTo}
                  onChange={(event) => setFilters({ ...filters, lastVisitTo: event.target.value })}
                />
              </label>
              <FilterSelect
                label="Sort By"
                value={filters.sortBy}
                options={['lastActivity', 'lastName', 'risk', 'programParticipation']}
                onChange={(value) => setFilters({ ...filters, sortBy: value as FiltersState['sortBy'] })}
              />
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setFilters({ ...filters })}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-5 py-3 text-sm font-semibold text-white"
            >
              Search Patients
            </button>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setFilters(defaultFilters);
              }}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] bg-white px-5 py-3 text-sm font-semibold text-[var(--tenant-primary-color)]"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </SurfaceCard>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <SurfaceCard title="Saved Filters" description="Quick views for the most common provider operations.">
            <div className="flex flex-wrap gap-2">
              {patientSavedFilters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => applySavedFilter(filter.id, setQuery, setFilters)}
                  className="rounded-full border border-[var(--border-subtle)] bg-slate-50 px-3 py-2 text-sm font-semibold text-[var(--text-secondary)]"
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard title="Patient Workspace" description="Enterprise patient search results with program and data visibility.">
            <div className="mb-4 flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'All Patients', icon: UserRound },
                { key: 'programs', label: 'Special Programs', icon: ClipboardList },
                { key: 'signals', label: 'Additional Data Signals', icon: Sparkles }
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key as DirectoryTab)}
                    className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                      active
                        ? 'bg-[var(--tenant-primary-color)] text-white'
                        : 'border border-[var(--border-subtle)] bg-white text-[var(--text-secondary)]'
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {isLoading ? (
              <div className="rounded-xl border border-dashed border-[var(--border-subtle)] bg-slate-50 px-4 py-8 text-center text-sm text-[var(--text-secondary)]">
                Loading patient results...
              </div>
            ) : null}

            {!isLoading && filteredPatients.length === 0 ? (
              <EmptyState
                title="No matching patients found"
                description="Try broadening your search, clearing a filter, or switching back to all patients."
              />
            ) : null}

            {!isLoading && filteredPatients.length > 0 && activeTab === 'all' ? (
              <div className="space-y-4">
                <PatientsResultsTable
                  records={filteredPatients}
                  onViewPatient={(patient) => {
                    setSelectedPatient(patient);
                    setDetailPatient(patient);
                  }}
                />
                <div className="grid gap-4 lg:grid-cols-2">
                  <SurfaceCard title="Program Enrollment Snapshot" description="Patients with actionable special program work.">
                    <div className="space-y-3">
                      {programPatients.slice(0, 4).map((record) => (
                        <article key={record.id} className="rounded-xl border border-[var(--border-subtle)] bg-slate-50/80 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-sm font-semibold text-[var(--text-primary)]">{record.patientName}</h3>
                              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                                {record.specialPrograms.map((program) => program.programName).join(', ')}
                              </p>
                            </div>
                            <StatusBadge label={record.specialPrograms[0]?.status ?? 'Program review'} />
                          </div>
                        </article>
                      ))}
                    </div>
                  </SurfaceCard>
                  <SurfaceCard title="Supplemental Data Signals" description="Plan-sourced insights surfaced for office review.">
                    <div className="space-y-3">
                      {filteredPatients.slice(0, 4).map((record) => (
                        <article key={record.id} className="rounded-xl border border-[var(--border-subtle)] bg-slate-50/80 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-sm font-semibold text-[var(--text-primary)]">{record.patientName}</h3>
                              <p className="mt-1 text-sm text-[var(--text-secondary)]">{record.supplementalData.careManagementSummary}</p>
                            </div>
                            <StatusBadge label={record.supplementalData.pgx.status} />
                          </div>
                        </article>
                      ))}
                    </div>
                  </SurfaceCard>
                </div>
              </div>
            ) : null}

            {!isLoading && filteredPatients.length > 0 && activeTab === 'programs' ? (
              <div className="space-y-4">
                {programPatients.map((record) => (
                  <article key={record.id} className="rounded-xl border border-[var(--border-subtle)] bg-white p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPatient(record);
                            setDetailPatient(record);
                          }}
                          className="text-left"
                        >
                          <h3 className="text-base font-semibold text-[var(--text-primary)]">{record.patientName}</h3>
                        </button>
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">
                          {record.memberId} · {record.productLine} · {record.assignedProvider}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {record.specialPrograms.map((program) => (
                          <StatusBadge key={program.id} label={program.status} />
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 overflow-hidden rounded-xl border border-[var(--border-subtle)]">
                      <table className="portal-data-table w-full border-collapse bg-white text-sm">
                        <thead>
                          <tr className="text-left text-[var(--text-muted)]">
                            <th className="px-4 py-3 font-medium">Program Name</th>
                            <th className="px-4 py-3 font-medium">Enrollment Status</th>
                            <th className="px-4 py-3 font-medium">Effective Date</th>
                            <th className="px-4 py-3 font-medium">Referring Entity</th>
                            <th className="px-4 py-3 font-medium">Last Outreach</th>
                            <th className="px-4 py-3 font-medium">Next Action Due</th>
                            <th className="px-4 py-3 font-medium">Outcome / Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {record.specialPrograms.map((program) => (
                            <tr key={program.id} className="border-t border-[var(--border-subtle)] align-top">
                              <td className="px-4 py-3 text-[var(--text-primary)]">{program.programName}</td>
                              <td className="px-4 py-3"><StatusBadge label={program.status} /></td>
                              <td className="px-4 py-3 text-[var(--text-secondary)]">{formatDate(program.effectiveDate)}</td>
                              <td className="px-4 py-3 text-[var(--text-secondary)]">{program.referringEntity}</td>
                              <td className="px-4 py-3 text-[var(--text-secondary)]">{formatDate(program.lastOutreach)}</td>
                              <td className="px-4 py-3 text-[var(--text-secondary)]">{formatDate(program.nextActionDue)}</td>
                              <td className="px-4 py-3 text-[var(--text-secondary)]">{program.notesPreview}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}

            {!isLoading && filteredPatients.length > 0 && activeTab === 'signals' ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {filteredPatients.map((record) => (
                  <article key={record.id} className="rounded-xl border border-[var(--border-subtle)] bg-white p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPatient(record);
                            setDetailPatient(record);
                          }}
                          className="text-left"
                        >
                          <h3 className="text-base font-semibold text-[var(--text-primary)]">{record.patientName}</h3>
                        </button>
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">{record.supplementalData.careManagementSummary}</p>
                      </div>
                      <StatusBadge label={record.supplementalData.pgx.status} />
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <DataPoint label="Utilization" value={record.supplementalData.utilizationSummary} />
                      <DataPoint label="Screening / Outreach" value={record.supplementalData.screeningStatus} />
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">SDOH indicators</p>
                        <ul className="mt-2 space-y-2 text-sm text-[var(--text-secondary)]">
                          {record.supplementalData.sdhIndicators.map((item) => (
                            <li key={item} className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-3 py-2">{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Clinical and adherence flags</p>
                        <ul className="mt-2 space-y-2 text-sm text-[var(--text-secondary)]">
                          {[...record.supplementalData.assessmentHighlights, ...record.supplementalData.adherenceFlags].map((item) => (
                            <li key={item} className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-3 py-2">{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-slate-50/80 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Pharmacogenomic data</p>
                          <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                            {record.supplementalData.pgx.medications.length
                              ? record.supplementalData.pgx.medications.join(', ')
                              : 'No PGx-targeted medications on file'}
                          </p>
                          <p className="mt-2 text-sm text-[var(--text-secondary)]">{record.supplementalData.pgx.considerationSummary}</p>
                        </div>
                        <StatusBadge label={record.supplementalData.pgx.alertLevel} />
                      </div>
                      <p className="mt-3 text-xs text-[var(--text-muted)]">{record.supplementalData.pgx.disclaimer}</p>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </SurfaceCard>
        </div>

        <div className="space-y-4">
          <SurfaceCard title="Panel Alerts" description="Current provider panel attention areas from plan data feeds.">
            <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
              <li className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
                {filteredPatients.filter((record) => record.recentFlags.includes('ED visit')).length} patients with ED visit activity in the active result set.
              </li>
              <li className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
                {pgxPatients.filter((record) => record.supplementalData.pgx.status === 'Available').length} patients have PGx results available for review.
              </li>
              <li className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
                {filteredPatients.reduce((sum, record) => sum + record.openCareGaps, 0)} total open care gaps across the current worklist.
              </li>
            </ul>
          </SurfaceCard>

          <SurfaceCard title="Selected Patient Preview" description="Quick glance detail for the currently selected patient.">
            {selectedPatient ? (
              <div className="space-y-3 text-sm text-[var(--text-secondary)]">
                <p className="text-base font-semibold text-[var(--text-primary)]">{selectedPatient.patientName}</p>
                <p>{selectedPatient.supplementalData.careManagementSummary}</p>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge label={selectedPatient.riskLevel} />
                  <StatusBadge label={selectedPatient.supplementalData.pgx.status} />
                </div>
                <p>Programs: {selectedPatient.specialPrograms.map((program) => program.programName).join(', ') || 'None'}</p>
                <button
                  type="button"
                  onClick={() => setDetailPatient(selectedPatient)}
                  className="inline-flex min-h-10 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-4 py-2 text-sm font-semibold text-white"
                >
                  Open Detail
                </button>
              </div>
            ) : (
              <p className="text-sm text-[var(--text-secondary)]">Select a patient from the results table to preview detail.</p>
            )}
          </SurfaceCard>
        </div>
      </section>

      <PatientDetailDrawer patient={detailPatient} onClose={() => setDetailPatient(null)} />
    </div>
  );
}
