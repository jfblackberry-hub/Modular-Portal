'use client';

import { useState } from 'react';

import type { BrokerGroup } from '../../lib/broker-portfolio-data';
import { EmptyState, InlineButton, PageHeader, StatCard, StatusBadge, SurfaceCard } from '../portal-ui';

type DetailTab = 'overview' | 'products' | 'enrollment' | 'documents' | 'renewal';

function formatDateLabel(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function BrokerEmployerGroupDetailPage({ group }: { group: BrokerGroup }) {
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Broker E&B Portal"
        title={group.groupName}
        description={`${group.segment} account in the ${group.region} region. Review products, enrollment readiness, documents, renewal posture, and current activity from one broker workspace.`}
        actions={
          <>
            <InlineButton href="/broker/book-of-business" tone="secondary">
              Back to book
            </InlineButton>
            <InlineButton href="/broker/renewals">Review renewal</InlineButton>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Enrolled lives"
          value={group.enrolledLives.toLocaleString()}
          detail={`${group.segment} account size for current reporting.`}
          tone="info"
        />
        <StatCard
          label="Status"
          value={group.status}
          detail={`Assigned rep ${group.assignedRep} with account manager ${group.accountManager}.`}
          tone={group.status === 'At risk' ? 'danger' : group.status.includes('Renewal') ? 'warning' : 'success'}
        />
        <StatCard
          label="Renewal date"
          value={formatDateLabel(group.renewalDate)}
          detail={`Effective date ${formatDateLabel(group.effectiveDate)}.`}
          tone="warning"
        />
        <StatCard
          label="Current products"
          value={group.currentProducts.length.toString()}
          detail={group.currentProducts.join(', ')}
          tone="default"
        />
      </section>

      <SurfaceCard title="Group quick actions" description="Broker shortcuts for the most common group-level workflows.">
        <div className="flex flex-wrap gap-3">
          <InlineButton href="/broker/quotes" tone="secondary">
            Start quote
          </InlineButton>
          <InlineButton href="/broker/documents" tone="secondary">
            Upload census
          </InlineButton>
          <InlineButton href="/broker/enrollments" tone="secondary">
            Review enrollment
          </InlineButton>
          <InlineButton href="/broker/commissions" tone="secondary">
            View commissions
          </InlineButton>
        </div>
      </SurfaceCard>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.8fr)]">
        <div className="space-y-4">
          <SurfaceCard title="Workspace tabs" description="Switch between overview, plan, enrollment, document, and renewal context.">
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'overview', label: 'Overview' },
                { key: 'products', label: 'Products / Plans' },
                { key: 'enrollment', label: 'Enrollment' },
                { key: 'documents', label: 'Documents' },
                { key: 'renewal', label: 'Renewal' }
              ].map((tab) => {
                const active = tab.key === activeTab;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key as DetailTab)}
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

          {activeTab === 'overview' ? (
            <SurfaceCard title="Overview" description="Current account profile, operating posture, and notable exceptions.">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-[var(--border-subtle)] bg-white p-4">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Group profile</p>
                  <dl className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
                    <div className="flex justify-between gap-3">
                      <dt>Line of business</dt>
                      <dd>{group.lineOfBusiness}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Assigned rep</dt>
                      <dd>{group.assignedRep}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Account manager</dt>
                      <dd>{group.accountManager}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Commission status</dt>
                      <dd>{group.commissionStatus}</dd>
                    </div>
                  </dl>
                </div>
                <div className="rounded-3xl border border-[var(--border-subtle)] bg-white p-4">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Alerts and exceptions</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--text-secondary)]">
                    {group.alerts.concat(group.carrierAlerts).map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </SurfaceCard>
          ) : null}

          {activeTab === 'products' ? (
            <SurfaceCard title="Products and plans summary" description="Current product lineup and enrolled employee counts by plan.">
              {group.plansSummary.length === 0 ? (
                <EmptyState
                  title="No active plans loaded"
                  description="This group is still in quote or pre-implementation stages, so final plan selections are not posted yet."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="portal-data-table w-full border-collapse bg-white text-sm">
                    <thead>
                      <tr>
                        <th>Carrier</th>
                        <th>Plan</th>
                        <th>Funding</th>
                        <th>Enrolled employees</th>
                        <th>Effective date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.plansSummary.map((plan) => (
                        <tr key={`${plan.carrier}-${plan.planName}`}>
                          <td>{plan.carrier}</td>
                          <td>{plan.planName}</td>
                          <td>{plan.fundingType}</td>
                          <td>{plan.enrolledEmployees.toLocaleString()}</td>
                          <td>{formatDateLabel(plan.effectiveDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SurfaceCard>
          ) : null}

          {activeTab === 'enrollment' ? (
            <SurfaceCard title="Enrollment status summary" description="Current enrollment readiness, pending file issues, and effective-date watch points.">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-[var(--border-subtle)] bg-white p-4">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Enrollment status</p>
                  <p className="mt-3 text-2xl font-semibold text-[var(--text-primary)]">
                    {group.enrollmentSummary.completionRate}%
                  </p>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    {group.enrollmentSummary.status}
                  </p>
                  <p className="mt-2 text-xs text-[var(--text-muted)]">
                    Last file date {formatDateLabel(group.enrollmentSummary.lastFileDate)}
                  </p>
                </div>
                <div className="rounded-3xl border border-[var(--border-subtle)] bg-white p-4">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Pending items</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--text-secondary)]">
                    {group.enrollmentSummary.pendingItems.length > 0 ? (
                      group.enrollmentSummary.pendingItems.map((item) => <li key={item}>• {item}</li>)
                    ) : (
                      <li>No enrollment blockers currently open.</li>
                    )}
                  </ul>
                </div>
              </div>
            </SurfaceCard>
          ) : null}

          {activeTab === 'documents' ? (
            <SurfaceCard title="Documents summary" description="Document status for census, signed forms, and renewal or implementation support files.">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-[var(--border-subtle)] bg-white p-4">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Missing items</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--text-secondary)]">
                    {group.documentsSummary.missingItems.length > 0 ? (
                      group.documentsSummary.missingItems.map((item) => <li key={item}>• {item}</li>)
                    ) : (
                      <li>No open document requests.</li>
                    )}
                  </ul>
                </div>
                <div className="rounded-3xl border border-[var(--border-subtle)] bg-white p-4">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Recent documents</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--text-secondary)]">
                    {group.documentsSummary.recentDocuments.map((item) => <li key={item}>• {item}</li>)}
                  </ul>
                </div>
              </div>
            </SurfaceCard>
          ) : null}

          {activeTab === 'renewal' ? (
            <SurfaceCard title="Renewal status summary" description="Decision timing, rate release visibility, and current broker renewal blockers.">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-[var(--border-subtle)] bg-white p-4">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Renewal timeline</p>
                  <dl className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
                    <div className="flex justify-between gap-3">
                      <dt>Stage</dt>
                      <dd>{group.renewalSummary.stage}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Rate release</dt>
                      <dd>{formatDateLabel(group.renewalSummary.rateReleaseDate)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Decision deadline</dt>
                      <dd>{formatDateLabel(group.renewalSummary.decisionDeadline)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Last touchpoint</dt>
                      <dd>{formatDateLabel(group.renewalSummary.lastTouchpoint)}</dd>
                    </div>
                  </dl>
                </div>
                <div className="rounded-3xl border border-[var(--border-subtle)] bg-white p-4">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Current blockers</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--text-secondary)]">
                    {group.renewalSummary.blockers.length > 0 ? (
                      group.renewalSummary.blockers.map((item) => <li key={item}>• {item}</li>)
                    ) : (
                      <li>No active renewal blockers.</li>
                    )}
                  </ul>
                </div>
              </div>
            </SurfaceCard>
          ) : null}
        </div>

        <div className="space-y-4">
          <SurfaceCard title="Activity timeline" description="Recent broker, carrier, and client-facing activity for this employer group.">
            <div className="space-y-3">
              {group.activities.map((item) => (
                <div
                  key={`${item.date}-${item.description}`}
                  className="rounded-3xl border border-[var(--border-subtle)] bg-white p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{item.type}</p>
                    <p className="text-xs text-[var(--text-muted)]">{formatDateLabel(item.date)}</p>
                  </div>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">{item.description}</p>
                  <p className="mt-2 text-xs text-[var(--text-muted)]">{item.actor}</p>
                </div>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard title="Notes" description="Mock broker notes and account context for this group.">
            <div className="space-y-3">
              {group.notes.map((note) => (
                <div
                  key={note}
                  className="rounded-3xl border border-[var(--border-subtle)] bg-white px-4 py-3 text-sm leading-6 text-[var(--text-secondary)]"
                >
                  {note}
                </div>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard title="Current status" description="Quick account indicators for broker review.">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-3xl border border-[var(--border-subtle)] bg-white p-4">
                <span className="text-sm text-[var(--text-secondary)]">Portfolio status</span>
                <StatusBadge label={group.status} />
              </div>
              <div className="rounded-3xl border border-[var(--border-subtle)] bg-white p-4">
                <p className="text-sm text-[var(--text-secondary)]">MTD commission</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                  ${group.mtdCommission.toLocaleString()}
                </p>
              </div>
            </div>
          </SurfaceCard>
        </div>
      </div>
    </div>
  );
}
