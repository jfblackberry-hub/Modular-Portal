'use client';

import { useEffect, useState } from 'react';

import { SectionCard } from '../../../components/section-card';
import { apiBaseUrl, getAdminAuthHeaders } from '../../../lib/api-auth';

type AuditEvent = {
  id: string;
  tenantId: string;
  userId: string | null;
  eventType: string;
  resourceType: string;
  resourceId: string | null;
  timestamp: string;
};

type AuditResponse = {
  items: AuditEvent[];
  pagination: {
    totalCount: number;
  };
};

export function PlatformAuditLog() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAuditEvents() {
      setIsLoading(true);
      setError('');

      try {
        const response = await fetch(`${apiBaseUrl}/platform-admin/audit/events?page_size=25`, {
          cache: 'no-store',
          headers: getAdminAuthHeaders()
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            message?: string;
          } | null;
          setError(payload?.message ?? 'Unable to load platform audit events.');
          setEvents([]);
          return;
        }

        const payload = (await response.json()) as AuditResponse;
        setEvents(payload.items);
      } catch {
        setError('Unable to load platform audit events.');
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    }

    void loadAuditEvents();
  }, []);

  return (
    <SectionCard
      title="Platform audit log"
      description="Platform-wide audit activity across tenants, users, and operator actions."
    >
      {error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-admin-muted">Loading audit log...</p>
      ) : events.length === 0 ? (
        <p className="text-sm text-admin-muted">No audit events available.</p>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <article
              key={event.id}
              className="rounded-2xl border border-admin-border bg-slate-50 p-4"
            >
              <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-admin-text">
                    {event.eventType}
                  </p>
                  <p className="mt-1 text-sm text-admin-muted">
                    {event.resourceType}
                    {event.resourceId ? ` • ${event.resourceId}` : ''}
                  </p>
                </div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-admin-muted">
                  {new Date(event.timestamp).toLocaleString()}
                </p>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-admin-muted md:grid-cols-2">
                <p>Tenant: {event.tenantId}</p>
                <p>User: {event.userId ?? 'System'}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
