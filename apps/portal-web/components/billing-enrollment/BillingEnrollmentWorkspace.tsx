import Link from 'next/link';

import { PageHeader, StatusBadge, SurfaceCard } from '../portal-ui';

type WorkspaceSection =
  | 'overview'
  | 'enrollment'
  | 'plans'
  | 'rules'
  | 'invoices'
  | 'payments'
  | 'documents'
  | 'renewals'
  | 'notices'
  | 'support';

const navItems: Array<{ key: WorkspaceSection; label: string; href: string }> = [
  { key: 'overview', label: 'Overview', href: '/dashboard/billing-enrollment' },
  { key: 'enrollment', label: 'Enrollment', href: '/dashboard/billing-enrollment/enrollment' },
  { key: 'plans', label: 'Plan Catalog', href: '/dashboard/billing-enrollment/plans' },
  { key: 'rules', label: 'Eligibility Rules', href: '/dashboard/billing-enrollment/rules' },
  { key: 'invoices', label: 'Invoices', href: '/dashboard/billing-enrollment/invoices' },
  { key: 'payments', label: 'Payments', href: '/dashboard/billing-enrollment/payments' },
  { key: 'documents', label: 'Documents', href: '/dashboard/billing-enrollment/documents' },
  { key: 'renewals', label: 'Renewals & Life Events', href: '/dashboard/billing-enrollment/renewals' },
  { key: 'notices', label: 'Notices', href: '/dashboard/billing-enrollment/notices' },
  { key: 'support', label: 'Support', href: '/dashboard/billing-enrollment/support' }
];

const sectionDescriptions: Record<WorkspaceSection, string> = {
  overview: 'Operational summary across enrollment, premiums, payments, and correspondence.',
  enrollment: 'Enrollment orchestration status, case tracking, and household progress.',
  plans: 'Plan catalog and product options aligned to available line-of-business offerings.',
  rules: 'Eligibility and household rules used to determine enrollment outcomes.',
  invoices: 'Invoice and premium management workflow including due and paid periods.',
  payments: 'Payment orchestration and gateway transaction lifecycle tracking.',
  documents: 'Document requirement intake and verification status.',
  renewals: 'Renewal and life-event workflow orchestration and deadlines.',
  notices: 'Notices and correspondence generation, queueing, and delivery status.',
  support: 'Context-aware support, case status tracking, and contact pathways.'
};

export function BillingEnrollmentWorkspace({ section }: { section: WorkspaceSection }) {
  const description = sectionDescriptions[section];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Licensed Module"
        title="Billing & Enrollment"
        description={description}
      />

      <SurfaceCard title="Module navigation" description="Tenant-aware navigation for Billing & Enrollment workflows.">
        <div className="flex flex-wrap gap-2">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`inline-flex min-h-10 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition ${
                item.key === section
                  ? 'bg-[var(--tenant-primary-color)] text-white'
                  : 'border border-[var(--tenant-primary-color)] bg-white text-[var(--tenant-primary-color)] hover:bg-sky-50'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </SurfaceCard>

      <div className="grid gap-4 xl:grid-cols-4">
        <SurfaceCard title="Enrollment cases">
          <p className="text-3xl font-semibold text-[var(--text-primary)]">14</p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">7 in progress, 3 pending verification</p>
        </SurfaceCard>
        <SurfaceCard title="Open invoices">
          <p className="text-3xl font-semibold text-[var(--text-primary)]">9</p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">$12,341.22 outstanding premium</p>
        </SurfaceCard>
        <SurfaceCard title="Payment queue">
          <p className="text-3xl font-semibold text-[var(--text-primary)]">6</p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Gateway sync every 15 minutes</p>
        </SurfaceCard>
        <SurfaceCard title="Document requirements">
          <p className="text-3xl font-semibold text-[var(--text-primary)]">11</p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">5 missing, 4 received, 2 verified</p>
        </SurfaceCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SurfaceCard title="Workflow orchestration" description="Stub services integrated with workflow and audit patterns.">
          <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
            <li className="rounded-lg border border-[var(--border-subtle)] bg-slate-50 px-3 py-2">
              Enrollment orchestration: <StatusBadge label="In Review" />
            </li>
            <li className="rounded-lg border border-[var(--border-subtle)] bg-slate-50 px-3 py-2">
              Renewal workflow: <StatusBadge label="Pending" />
            </li>
            <li className="rounded-lg border border-[var(--border-subtle)] bg-slate-50 px-3 py-2">
              Life event intake: <StatusBadge label="Needs Info" />
            </li>
          </ul>
        </SurfaceCard>

        <SurfaceCard title="Integration adapters" description="Placeholder adapters for external system handoffs.">
          <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
            <li className="rounded-lg border border-[var(--border-subtle)] bg-slate-50 px-3 py-2">
              Core admin system adapter
            </li>
            <li className="rounded-lg border border-[var(--border-subtle)] bg-slate-50 px-3 py-2">
              Payment gateway adapter
            </li>
            <li className="rounded-lg border border-[var(--border-subtle)] bg-slate-50 px-3 py-2">
              Document repository adapter
            </li>
            <li className="rounded-lg border border-[var(--border-subtle)] bg-slate-50 px-3 py-2">
              CRM / case management adapter
            </li>
          </ul>
        </SurfaceCard>
      </div>
    </div>
  );
}
