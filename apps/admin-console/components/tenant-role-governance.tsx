'use client';

import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { apiBaseUrl, getAdminAuthHeaders, getStoredAdminUserId } from '../lib/api-auth';
import { SectionCard } from './section-card';

type Role = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  permissions: string[];
};

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roles: string[];
  permissions: string[];
};

type SettingsPayload = {
  roles: Role[];
  users: User[];
};

export function TenantRoleGovernance() {
  const [settings, setSettings] = useState<SettingsPayload | null>(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [removingRoleKey, setRemovingRoleKey] = useState('');

  async function loadData() {
    if (!getStoredAdminUserId()) {
      setError('Sign in with a tenant admin account to manage tenant roles.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/tenant-admin/settings`, {
        cache: 'no-store',
        headers: getAdminAuthHeaders()
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(payload?.message ?? 'Unable to load tenant role governance.');
      }

      const payload = (await response.json()) as SettingsPayload;
      setSettings(payload);
      setSelectedUserId((current) => current || payload.users[0]?.id || '');
      setSelectedRoleId((current) => current || payload.roles[0]?.id || '');
    } catch (nextError) {
      setSettings(null);
      setError(
        nextError instanceof Error
          ? nextError.message
          : 'Unable to load tenant role governance.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const filteredUsers = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    return (settings?.users ?? []).filter((user) => {
      if (!normalized) {
        return true;
      }

      return [user.firstName, user.lastName, user.email, ...user.roles]
        .join(' ')
        .toLowerCase()
        .includes(normalized);
    });
  }, [search, settings?.users]);

  async function handleAssignRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsAssigning(true);

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/tenant-admin/users/${selectedUserId}/roles`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAdminAuthHeaders()
          },
          body: JSON.stringify({ roleId: selectedRoleId })
        }
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(payload?.message ?? 'Unable to assign role.');
      }

      setSuccess('Role assignment saved.');
      await loadData();
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : 'Unable to assign role.'
      );
    } finally {
      setIsAssigning(false);
    }
  }

  async function handleRemoveRole(userId: string, roleCode: string) {
    const role = settings?.roles.find((item) => item.code === roleCode);

    if (!role) {
      setError(`Role ${roleCode} is not available for removal.`);
      return;
    }

    const removalKey = `${userId}:${roleCode}`;
    setRemovingRoleKey(removalKey);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/tenant-admin/users/${userId}/roles/${role.id}`,
        {
          method: 'DELETE',
          headers: getAdminAuthHeaders()
        }
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(payload?.message ?? 'Unable to remove role.');
      }

      setSuccess(`Removed ${roleCode} from user.`);
      await loadData();
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : 'Unable to remove role.'
      );
    } finally {
      setRemovingRoleKey('');
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <SectionCard title={String(settings?.roles.length ?? 0)} description="Roles">
          <p className="text-sm text-admin-muted">
            Tenant-scoped RBAC definitions available for assignment.
          </p>
        </SectionCard>
        <SectionCard title={String(settings?.users.length ?? 0)} description="Users">
          <p className="text-sm text-admin-muted">
            Current tenant users and their effective role assignments.
          </p>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <SectionCard
          title="Assign tenant role"
          description="Use API-backed controls to assign existing tenant roles to users."
        >
          <form className="space-y-4" onSubmit={handleAssignRole}>
            <input
              className="w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search users"
            />
            <select
              className="w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
            >
              {filteredUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} ({user.email})
                </option>
              ))}
            </select>
            <select
              className="w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
              value={selectedRoleId}
              onChange={(event) => setSelectedRoleId(event.target.value)}
            >
              {settings?.roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name} ({role.code})
                </option>
              ))}
            </select>
            {error ? (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </p>
            ) : null}
            {success ? (
              <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {success}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={isAssigning || isLoading || !selectedUserId || !selectedRoleId}
              className="rounded-full bg-admin-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isAssigning ? 'Assigning role...' : 'Assign role'}
            </button>
          </form>
        </SectionCard>

        <SectionCard
          title="Current assignments"
          description="Review effective tenant role assignments and remove them without leaving the control plane."
        >
          {isLoading ? (
            <p className="text-sm text-admin-muted">Loading tenant roles...</p>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <article
                  key={user.id}
                  className="rounded-2xl border border-admin-border bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-admin-text">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-admin-muted">{user.email}</p>
                    </div>
                    <p className="text-xs uppercase tracking-[0.18em] text-admin-muted">
                      {user.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {user.roles.length > 0 ? (
                      user.roles.map((roleCode) => (
                        <button
                          key={roleCode}
                          type="button"
                          onClick={() => void handleRemoveRole(user.id, roleCode)}
                          disabled={removingRoleKey === `${user.id}:${roleCode}`}
                          className="rounded-full border border-admin-border bg-white px-3 py-1 text-xs font-medium text-admin-text transition hover:border-rose-300 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {removingRoleKey === `${user.id}:${roleCode}`
                            ? `Removing ${roleCode}...`
                            : roleCode}
                        </button>
                      ))
                    ) : (
                      <span className="text-sm text-admin-muted">No roles assigned</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
