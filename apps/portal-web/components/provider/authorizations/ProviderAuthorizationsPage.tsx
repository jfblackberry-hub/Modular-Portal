'use client';

import { useMemo, useState } from 'react';

import type {
  ProviderPortalConfig,
  ProviderPortalVariant,
  ProviderReferralItem,
  ProviderTrackedAuthorizationItem
} from '../../../config/providerPortalConfig';
import { ProviderWorkflowActionButton } from '../operations/provider-workflow-action-button';
import { PageHeader, StatusBadge, SurfaceCard } from '../../portal-ui';

type AuthorizationTabKey =
  | 'check-requirement'
  | 'submit-request'
  | 'track-requests'
  | 'referrals'
  | 'attachments';

type ModuleField = {
  id: string;
  label: string;
  placeholder?: string;
  type?: 'text' | 'date' | 'select' | 'textarea';
  options?: string[];
};

function getModuleFields(variant: ProviderPortalVariant) {
  const requestTerm =
    variant === 'pharmacy'
      ? 'Medication request'
      : variant === 'dental'
        ? 'Treatment request'
        : variant === 'vision'
          ? 'Vision request'
          : 'Authorization request';

  return {
    checkRequirement: [
      { id: 'service-type', label: 'Service Type', type: 'select', options: ['Outpatient', 'Inpatient', 'Diagnostic', 'Specialty'] },
      { id: 'cpt-hcpcs', label: 'CPT / HCPCS (placeholder)', placeholder: 'e.g., 99213 or J9999' },
      { id: 'diagnosis', label: 'Diagnosis (placeholder)', placeholder: 'ICD-10 code or diagnosis text' },
      { id: 'rendering-provider', label: 'Rendering Provider', placeholder: 'Provider name or NPI' },
      { id: 'servicing-location', label: 'Servicing Location', placeholder: 'Clinic or office location' },
      { id: 'date-of-service', label: 'Date of Service', type: 'date' }
    ] as ModuleField[],
    submitRequest: [
      { id: 'patient-info', label: 'Patient Info', placeholder: 'Member name and ID' },
      { id: 'service-details', label: 'Service Details', placeholder: 'Procedure and requested units', type: 'textarea' },
      { id: 'diagnosis-rationale', label: 'Diagnosis / Clinical Rationale', placeholder: 'Clinical notes and rationale', type: 'textarea' },
      { id: 'urgency', label: 'Urgency', type: 'select', options: ['Standard', 'Urgent', 'Expedited'] },
      { id: 'referring-provider', label: 'Referring Provider', placeholder: 'Referring provider name/NPI' },
      { id: 'rendering-provider-submit', label: 'Rendering Provider', placeholder: 'Rendering provider name/NPI' }
    ] as ModuleField[],
    requestTerm
  };
}

function FieldControl({ field }: { field: ModuleField }) {
  if (field.type === 'textarea') {
    return (
      <textarea
        rows={4}
        placeholder={field.placeholder}
        className="portal-input px-3 py-2 text-sm"
      />
    );
  }

  if (field.type === 'select') {
    return (
      <select className="portal-input px-3 py-2 text-sm" defaultValue="">
        <option value="" disabled>
          Select option
        </option>
        {(field.options ?? []).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      type={field.type ?? 'text'}
      placeholder={field.placeholder}
      className="portal-input px-3 py-2 text-sm"
    />
  );
}

export function ProviderAuthorizationsPage({
  config,
  variant,
  embedded = false
}: {
  config: ProviderPortalConfig;
  variant: ProviderPortalVariant;
  embedded?: boolean;
}) {
  const labels = config.authorizationsModule.labels;
  const [activeTab, setActiveTab] = useState<AuthorizationTabKey>('check-requirement');
  const fields = useMemo(() => getModuleFields(variant), [variant]);

  const tabs: Array<{ key: AuthorizationTabKey; label: string }> = [
    { key: 'check-requirement', label: labels.checkRequirement },
    { key: 'submit-request', label: labels.submitRequest },
    { key: 'track-requests', label: labels.trackRequests },
    { key: 'referrals', label: labels.referrals },
    { key: 'attachments', label: labels.attachments }
  ];

  const requestStatuses = [
    'Draft',
    'Submitted',
    'In Review',
    'More Info Needed',
    'Approved',
    'Denied',
    'Cancelled'
  ];

  const trackedRequests: ProviderTrackedAuthorizationItem[] =
    config.demoData?.trackedAuthorizations ?? [
    {
      status: 'Submitted',
      submittedDate: '2026-03-14',
      referenceNumber: 'PA-100245',
      patient: 'Taylor Morgan',
      service: 'MRI Lumbar Spine',
      decision: 'Pending review',
      nextAction: 'Await payer review'
    },
    {
      status: 'More Info Needed',
      submittedDate: '2026-03-13',
      referenceNumber: 'PA-100233',
      patient: 'Jordan Patel',
      service: 'Outpatient PT - 12 visits',
      decision: 'Additional clinical notes requested',
      nextAction: 'Upload chart notes'
    },
    {
      status: 'Approved',
      submittedDate: '2026-03-12',
      referenceNumber: 'PA-100217',
      patient: 'Avery Brooks',
      service: 'Sleep study',
      decision: 'Approved for 1 service date',
      nextAction: 'Schedule service'
    }
  ];

  const referrals: ProviderReferralItem[] = config.demoData?.referrals ?? [
    {
      reference: 'RF-2201',
      patient: 'Taylor Morgan',
      specialty: 'Cardiology',
      status: 'In Review',
      submittedDate: '2026-03-14'
    },
    {
      reference: 'RF-2196',
      patient: 'Jordan Patel',
      specialty: 'Neurology',
      status: 'Approved',
      submittedDate: '2026-03-12'
    },
    {
      reference: 'RF-2188',
      patient: 'Avery Brooks',
      specialty: 'Pain Management',
      status: 'Cancelled',
      submittedDate: '2026-03-10'
    }
  ];

  return (
    <div className="space-y-6">
      {embedded ? null : (
        <PageHeader
          eyebrow={config.displayName}
          title={labels.title}
          description={labels.description}
        />
      )}

      <SurfaceCard title="Module Views" description="Switch between requirement checks, submissions, tracking, referrals, and attachments.">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const active = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex min-h-10 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? 'bg-[var(--tenant-primary-color)] text-white'
                    : 'border border-[var(--border-subtle)] bg-white text-[var(--text-secondary)] hover:border-[var(--tenant-primary-color)] hover:text-[var(--tenant-primary-color)]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </SurfaceCard>

      {activeTab === 'check-requirement' ? (
        <SurfaceCard title={`${labels.requestTerm} Requirement Check`} description="Determine whether prior authorization is required for the requested service.">
          <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {fields.checkRequirement.map((field) => (
              <label key={field.id} className="text-sm text-[var(--text-secondary)]">
                <span className="mb-1 block font-medium text-[var(--text-primary)]">{field.label}</span>
                <FieldControl field={field} />
              </label>
            ))}
          </form>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Check Requirement
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] bg-white px-5 py-3 text-sm font-semibold text-[var(--tenant-primary-color)] transition hover:bg-sky-50"
            >
              Save Draft
            </button>
          </div>
        </SurfaceCard>
      ) : null}

      {activeTab === 'submit-request' ? (
        <SurfaceCard title={`Submit ${labels.requestTerm}`} description="Capture patient, service, and clinical rationale details for submission.">
          <form className="grid gap-4 md:grid-cols-2">
            {fields.submitRequest.map((field) => (
              <label key={field.id} className="text-sm text-[var(--text-secondary)] md:col-span-1">
                <span className="mb-1 block font-medium text-[var(--text-primary)]">{field.label}</span>
                <FieldControl field={field} />
              </label>
            ))}
            <label className="text-sm text-[var(--text-secondary)] md:col-span-2">
              <span className="mb-1 block font-medium text-[var(--text-primary)]">Attachment Upload Area</span>
              <div className="rounded-xl border border-dashed border-[var(--border-subtle)] bg-slate-50 p-4">
                <input type="file" className="text-sm" />
                <p className="mt-2 text-xs text-[var(--text-muted)]">Upload supporting clinical documents (placeholder).</p>
              </div>
            </label>
          </form>
          <div className="mt-4 flex flex-wrap gap-3">
            <ProviderWorkflowActionButton
              label="Submit Request"
              tone="primary"
              request={{
                actionType: 'authorization_update',
                capabilityId: 'provider_operations',
                widgetId: 'authorizations',
                targetType: 'authorization',
                targetId: 'authorization-request-draft',
                targetLabel: labels.requestTerm,
                reason: 'Provider user submitted an authorization update from the authorizations workspace.',
                payload: {
                  mode: 'submit_request'
                }
              }}
            />
            <ProviderWorkflowActionButton
              label="Save Draft"
              request={{
                actionType: 'status_change',
                capabilityId: 'provider_operations',
                widgetId: 'authorizations',
                targetType: 'authorization',
                targetId: 'authorization-request-draft',
                targetLabel: `${labels.requestTerm} draft`,
                reason: 'Provider user saved an authorization draft.',
                payload: {
                  mode: 'save_draft',
                  desiredStatus: 'Draft'
                }
              }}
            />
          </div>
        </SurfaceCard>
      ) : null}

      {activeTab === 'track-requests' ? (
        <SurfaceCard title="Track Requests" description="View statuses, decisions, and next actions for submitted requests.">
          <div className="mb-4 flex flex-wrap gap-2">
            {requestStatuses.map((status) => (
              <StatusBadge key={status} label={status} />
            ))}
          </div>
          <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)]">
            <table className="portal-data-table w-full border-collapse bg-white text-sm">
              <thead>
                <tr className="text-left text-[var(--text-muted)]">
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Submitted Date</th>
                  <th className="px-4 py-3 font-medium">Reference Number</th>
                  <th className="px-4 py-3 font-medium">Patient</th>
                  <th className="px-4 py-3 font-medium">Service</th>
                  <th className="px-4 py-3 font-medium">Decision</th>
                  <th className="px-4 py-3 font-medium">Next Action</th>
                </tr>
              </thead>
              <tbody>
                {trackedRequests.map((row) => (
                  <tr key={row.referenceNumber} className="border-t border-[var(--border-subtle)] align-top">
                    <td className="px-4 py-3"><StatusBadge label={row.status} /></td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{row.submittedDate}</td>
                    <td className="px-4 py-3 text-[var(--text-primary)]">{row.referenceNumber}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{row.patient}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{row.service}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{row.decision}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{row.nextAction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SurfaceCard>
      ) : null}

      {activeTab === 'referrals' ? (
        <SurfaceCard title="Referrals" description="Create and track referral activity with status visibility.">
          <div className="mb-4 flex flex-wrap gap-3">
            <ProviderWorkflowActionButton
              label={`Create ${labels.referralTerm}`}
              tone="primary"
              request={{
                actionType: 'operational_follow_up',
                capabilityId: 'provider_operations',
                widgetId: 'authorizations',
                targetType: 'operational_task',
                targetId: 'referral-create',
                targetLabel: labels.referralTerm,
                reason: 'Provider user created a referral from the authorizations workspace.'
              }}
            />
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] bg-white px-5 py-3 text-sm font-semibold text-[var(--tenant-primary-color)] transition hover:bg-sky-50"
            >
              Track {labels.referralTerm}s
            </button>
          </div>
          <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)]">
            <table className="portal-data-table w-full border-collapse bg-white text-sm">
              <thead>
                <tr className="text-left text-[var(--text-muted)]">
                  <th className="px-4 py-3 font-medium">Reference</th>
                  <th className="px-4 py-3 font-medium">Patient</th>
                  <th className="px-4 py-3 font-medium">Specialty</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Submitted Date</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((row) => (
                  <tr key={row.reference} className="border-t border-[var(--border-subtle)]">
                    <td className="px-4 py-3 text-[var(--text-primary)]">{row.reference}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{row.patient}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{row.specialty}</td>
                    <td className="px-4 py-3"><StatusBadge label={row.status} /></td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{row.submittedDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SurfaceCard>
      ) : null}

      {activeTab === 'attachments' ? (
        <SurfaceCard title="Attachments / Clinical Docs" description="Upload and manage supporting clinical documentation for requests and referrals.">
          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-xl border border-dashed border-[var(--border-subtle)] bg-slate-50 p-4">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Upload supporting documents</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Attach clinical notes, labs, and imaging reports.</p>
              <input type="file" className="mt-3 text-sm" />
            </article>
            <article className="rounded-xl border border-[var(--border-subtle)] bg-white p-4">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Recent attachments</p>
              <ul className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
                <li>PA-100245-clinical-notes.pdf</li>
                <li>PA-100233-provider-letter.pdf</li>
                <li>RF-2201-referral-summary.pdf</li>
              </ul>
            </article>
          </div>
        </SurfaceCard>
      ) : null}
    </div>
  );
}
