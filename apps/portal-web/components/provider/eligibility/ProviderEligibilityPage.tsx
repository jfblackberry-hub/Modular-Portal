import Link from 'next/link';

import type {
  ProviderPortalConfig,
  ProviderPortalVariant
} from '../../../config/providerPortalConfig';
import { PageHeader, StatusBadge, SurfaceCard } from '../../portal-ui';

type EligibilityField = {
  id: string;
  label: string;
  placeholder: string;
  type?: 'text' | 'date';
};

type EligibilityPageConfig = {
  title: string;
  description: string;
  searchFields: EligibilityField[];
  benefitLabelSet: {
    officeVisit: string;
    specialistVisit: string;
    urgentCare: string;
    emergencyRoom: string;
    deductible: string;
    outOfPocketMax: string;
    coinsurance: string;
    copay: string;
  };
};

function getEligibilityPageConfig(variant: ProviderPortalVariant): EligibilityPageConfig {
  const commonFields: EligibilityField[] = [
    { id: 'member-id', label: 'Member ID', placeholder: 'Enter member ID' },
    { id: 'first-name', label: 'First Name', placeholder: 'Enter first name' },
    { id: 'last-name', label: 'Last Name', placeholder: 'Enter last name' },
    { id: 'dob', label: 'Date of Birth', placeholder: '', type: 'date' },
    { id: 'dos', label: 'Date of Service', placeholder: '', type: 'date' },
    { id: 'plan', label: 'Plan / Product (optional)', placeholder: 'Optional plan or product' }
  ];

  if (variant === 'pharmacy') {
    return {
      title: 'Eligibility and formulary review',
      description:
        'Validate member eligibility and pharmacy coverage details before medication fulfillment.',
      searchFields: commonFields,
      benefitLabelSet: {
        officeVisit: 'Retail pharmacy fill',
        specialistVisit: 'Specialty medication',
        urgentCare: 'Urgent medication override',
        emergencyRoom: 'Emergency medication fill',
        deductible: 'Pharmacy deductible',
        outOfPocketMax: 'Pharmacy out-of-pocket max',
        coinsurance: 'Medication coinsurance',
        copay: 'Medication copay'
      }
    };
  }

  if (variant === 'dental') {
    return {
      title: 'Dental eligibility and benefits',
      description:
        'Review dental coverage limits and benefit responsibilities before treatment.',
      searchFields: commonFields,
      benefitLabelSet: {
        officeVisit: 'Routine dental visit',
        specialistVisit: 'Specialist dental visit',
        urgentCare: 'Urgent dental care',
        emergencyRoom: 'Emergency dental care',
        deductible: 'Dental deductible',
        outOfPocketMax: 'Dental out-of-pocket max',
        coinsurance: 'Dental coinsurance',
        copay: 'Dental copay'
      }
    };
  }

  if (variant === 'vision') {
    return {
      title: 'Vision eligibility and benefits',
      description:
        'Check vision eligibility and member responsibility for exams and materials.',
      searchFields: commonFields,
      benefitLabelSet: {
        officeVisit: 'Vision exam',
        specialistVisit: 'Specialty vision service',
        urgentCare: 'Urgent vision care',
        emergencyRoom: 'Emergency vision care',
        deductible: 'Vision deductible',
        outOfPocketMax: 'Vision out-of-pocket max',
        coinsurance: 'Vision coinsurance',
        copay: 'Vision copay'
      }
    };
  }

  return {
    title: 'Eligibility and benefits',
    description:
      'Search members and confirm active coverage, benefits, and likely financial responsibility before service.',
    searchFields: commonFields,
    benefitLabelSet: {
      officeVisit: 'Office visit',
      specialistVisit: 'Specialist visit',
      urgentCare: 'Urgent care',
      emergencyRoom: 'Emergency room',
      deductible: 'Deductible',
      outOfPocketMax: 'Out-of-pocket max',
      coinsurance: 'Coinsurance',
      copay: 'Copay'
    }
  };
}

function getRelatedActionHref(config: ProviderPortalConfig, fallback: string, id: string) {
  return config.quickActions.find((action) => action.id === id)?.href ?? fallback;
}

export function ProviderEligibilityPage({
  config,
  variant
}: {
  config: ProviderPortalConfig;
  variant: ProviderPortalVariant;
}) {
  const page = getEligibilityPageConfig(variant);

  const benefitRows = [
    { label: page.benefitLabelSet.officeVisit, inNetwork: '$25 copay', outOfNetwork: '40% coinsurance' },
    { label: page.benefitLabelSet.specialistVisit, inNetwork: '$45 copay', outOfNetwork: '50% coinsurance' },
    { label: page.benefitLabelSet.urgentCare, inNetwork: '$75 copay', outOfNetwork: 'Not covered' },
    { label: page.benefitLabelSet.emergencyRoom, inNetwork: '$250 copay', outOfNetwork: '$250 copay' },
    { label: page.benefitLabelSet.deductible, inNetwork: '$500 / $2,000', outOfNetwork: '$1,500 / $4,500' },
    { label: page.benefitLabelSet.outOfPocketMax, inNetwork: '$3,500 / $7,000', outOfNetwork: '$9,000 / $18,000' },
    { label: page.benefitLabelSet.coinsurance, inNetwork: '20%', outOfNetwork: '40%' },
    { label: page.benefitLabelSet.copay, inNetwork: 'See service-level copays', outOfNetwork: 'Varies by service' }
  ];

  const relatedActions = [
    {
      label: 'View Digital ID Card',
      href: '/dashboard/id-card'
    },
    {
      label: 'Start Prior Authorization',
      href: getRelatedActionHref(config, '/provider/authorizations', 'new-authorization')
    },
    {
      label: 'Find Provider / Network',
      href: '/dashboard/providers'
    },
    {
      label: 'Print Summary',
      href: getRelatedActionHref(config, '/provider/eligibility', 'start-eligibility')
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${config.displayName}`}
        title={page.title}
        description={page.description}
      />

      <SurfaceCard title="Patient Search" description="Search by member demographics and service date.">
        <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {page.searchFields.map((field) => (
            <label key={field.id} className="text-sm text-[var(--text-secondary)]">
              <span className="mb-1 block font-medium text-[var(--text-primary)]">{field.label}</span>
              <input
                type={field.type ?? 'text'}
                placeholder={field.placeholder}
                className="portal-input px-3 py-2 text-sm"
              />
            </label>
          ))}
          <div className="md:col-span-2 xl:col-span-3 flex flex-wrap gap-3">
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Search Eligibility
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] bg-white px-5 py-3 text-sm font-semibold text-[var(--tenant-primary-color)] transition hover:bg-sky-50"
            >
              Clear Fields
            </button>
          </div>
        </form>
      </SurfaceCard>

      <SurfaceCard title="Search Results" description="Recent member matches from the current inquiry.">
        <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)]">
          <table className="portal-data-table w-full border-collapse bg-white text-sm">
            <thead>
              <tr className="text-left text-[var(--text-muted)]">
                <th className="px-4 py-3 font-medium">Member</th>
                <th className="px-4 py-3 font-medium">Member ID</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Coverage Status</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  member: 'Taylor Morgan',
                  memberId: 'M-48291',
                  plan: 'Blue Horizon PPO Plus',
                  status: 'Active'
                },
                {
                  member: 'Jordan Patel',
                  memberId: 'M-77420',
                  plan: 'Blue Horizon HMO Select',
                  status: 'Inactive'
                }
              ].map((result) => (
                <tr key={result.memberId} className="border-t border-[var(--border-subtle)]">
                  <td className="px-4 py-3 text-[var(--text-primary)]">{result.member}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{result.memberId}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{result.plan}</td>
                  <td className="px-4 py-3">
                    <StatusBadge label={result.status} />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="inline-flex items-center rounded-full border border-[var(--border-subtle)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)]"
                    >
                      Select
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SurfaceCard>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <SurfaceCard title="Coverage Summary" description="Current coverage and member enrollment summary.">
            <div className="grid gap-3 sm:grid-cols-2">
              <article className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Coverage status</p>
                <div className="mt-1"><StatusBadge label="Active" /></div>
              </article>
              <article className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Effective dates</p>
                <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">01/01/2026 - 12/31/2026</p>
              </article>
              <article className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Plan name</p>
                <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">Blue Horizon PPO Plus</p>
              </article>
              <article className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">PCP</p>
                <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">Placeholder - Assigned PCP</p>
              </article>
              <article className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3 sm:col-span-2">
                <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Line of business</p>
                <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">Placeholder - Commercial Medical</p>
              </article>
            </div>
          </SurfaceCard>

          <SurfaceCard title="Benefit Details" description="Sample in-network and out-of-network benefit view.">
            <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)]">
              <table className="portal-data-table w-full border-collapse bg-white text-sm">
                <thead>
                  <tr className="text-left text-[var(--text-muted)]">
                    <th className="px-4 py-3 font-medium">Benefit</th>
                    <th className="px-4 py-3 font-medium">In Network</th>
                    <th className="px-4 py-3 font-medium">Out of Network</th>
                  </tr>
                </thead>
                <tbody>
                  {benefitRows.map((row) => (
                    <tr key={row.label} className="border-t border-[var(--border-subtle)]">
                      <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{row.label}</td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">{row.inNetwork}</td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">{row.outOfNetwork}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SurfaceCard>
        </div>

        <div className="space-y-6">
          <SurfaceCard
            title="Financial Responsibility Snapshot"
            description="Likely patient responsibility placeholders for the selected service date."
          >
            <ul className="space-y-3 text-sm">
              <li className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Estimated copay at visit</p>
                <p className="mt-1 font-semibold text-[var(--text-primary)]">$45.00</p>
              </li>
              <li className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Deductible remaining</p>
                <p className="mt-1 font-semibold text-[var(--text-primary)]">$320.00 individual remaining</p>
              </li>
              <li className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Coinsurance estimate</p>
                <p className="mt-1 font-semibold text-[var(--text-primary)]">20% after deductible</p>
              </li>
              <li className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Note</p>
                <p className="mt-1 text-[var(--text-secondary)]">Final patient responsibility determined at claim adjudication.</p>
              </li>
            </ul>
          </SurfaceCard>

          <SurfaceCard title="Related Actions" description="Move quickly to connected provider workflows.">
            <ul className="space-y-2">
              {relatedActions.map((action) => (
                <li key={action.label}>
                  <Link
                    href={action.href}
                    className="inline-flex text-sm font-semibold text-[var(--tenant-primary-color)] hover:underline"
                  >
                    {action.label}
                  </Link>
                </li>
              ))}
            </ul>
          </SurfaceCard>
        </div>
      </section>
    </div>
  );
}
