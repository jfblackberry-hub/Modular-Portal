'use client';

import { useEffect, useState } from 'react';

import { config, getAdminAuthHeaders } from '../lib/api-auth';
import { SectionCard } from './section-card';

type Role = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  permissions: string[];
};

export function PermissionMatrix() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadRoles() {
      setIsLoading(true);
      setError('');

      try {
        const response = await fetch(`${config.apiBaseUrl}/platform-admin/roles`, {
          cache: 'no-store',
          headers: getAdminAuthHeaders()
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            message?: string;
          } | null;
          throw new Error(payload?.message ?? 'Unable to load permission matrix.');
        }

        const payload = (await response.json()) as Role[];

        if (!isMounted) {
          return;
        }

        setRoles(payload);
      } catch (nextError) {
        if (!isMounted) {
          return;
        }

        setRoles([]);
        setError(
          nextError instanceof Error
            ? nextError.message
            : 'Unable to load permission matrix.'
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadRoles();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <SectionCard
      title="Permission matrix"
      description="Role-to-permission coverage sourced from the RBAC API."
    >
      {error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-admin-muted">Loading role coverage...</p>
      ) : (
        <div className="space-y-4">
          {roles.map((role) => (
            <article
              key={role.id}
              className="rounded-2xl border border-admin-border bg-slate-50 p-5"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-admin-text">
                    {role.name}
                  </h2>
                  <p className="text-sm text-admin-muted">
                    {role.description || 'No description provided.'}
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-admin-accent">
                  {role.code}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {role.permissions.length > 0 ? (
                  role.permissions.map((permission) => (
                    <span
                      key={permission}
                      className="rounded-full bg-white px-3 py-1 text-xs font-medium text-admin-text"
                    >
                      {permission}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-admin-muted">No permissions attached</span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
