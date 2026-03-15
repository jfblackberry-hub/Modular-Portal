'use client';

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';

import { SectionCard } from '../../components/section-card';
import { apiBaseUrl, getAdminAuthHeaders } from '../../lib/api-auth';

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  tenant: {
    id: string;
    name: string;
  };
  roles: string[];
  permissions: string[];
};

type Tenant = {
  id: string;
  name: string;
};

type UserFormState = {
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
};

const emptyFormState: UserFormState = {
  tenantId: '',
  email: '',
  firstName: '',
  lastName: '',
  isActive: true
};

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [formState, setFormState] = useState<UserFormState>(emptyFormState);
  const [editingUserId, setEditingUserId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState('');

  async function loadData() {
    setIsLoading(true);
    setError('');

    try {
      const [usersResponse, tenantsResponse] = await Promise.all([
        fetch(`${apiBaseUrl}/platform-admin/users`, {
          cache: 'no-store',
          headers: getAdminAuthHeaders()
        }),
        fetch(`${apiBaseUrl}/platform-admin/tenants`, {
          cache: 'no-store',
          headers: getAdminAuthHeaders()
        })
      ]);

      if (!usersResponse.ok || !tenantsResponse.ok) {
        const payload =
          ((await usersResponse.json().catch(() => null)) as {
            message?: string;
          } | null) ??
          ((await tenantsResponse.json().catch(() => null)) as {
            message?: string;
          } | null);

        setError(payload?.message ?? 'Unable to load user administration data.');
        setUsers([]);
        setTenants([]);
        return;
      }

      const [usersPayload, tenantsPayload] = (await Promise.all([
        usersResponse.json(),
        tenantsResponse.json()
      ])) as [User[], Tenant[]];

      setUsers(usersPayload);
      setTenants(tenantsPayload);
      setFormState((current) => ({
        ...current,
        tenantId: current.tenantId || tenantsPayload[0]?.id || ''
      }));
    } catch {
      setError('API unavailable. Start the local API and try again.');
      setUsers([]);
      setTenants([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  function resetForm(nextTenantId?: string) {
    setEditingUserId('');
    setFormState({
      ...emptyFormState,
      tenantId: nextTenantId ?? tenants[0]?.id ?? ''
    });
  }

  function startEditing(user: User) {
    setEditingUserId(user.id);
    setFormState({
      tenantId: user.tenant.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive
    });
    setError('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch(
        editingUserId
          ? `${apiBaseUrl}/platform-admin/users/${editingUserId}`
          : `${apiBaseUrl}/platform-admin/users`,
        {
          method: editingUserId ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAdminAuthHeaders()
          },
          body: JSON.stringify(formState)
        }
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setError(
          payload?.message ??
            (editingUserId ? 'Unable to update user.' : 'Unable to create user.')
        );
        return;
      }

      await loadData();
      resetForm(formState.tenantId);
    } catch {
      setError(editingUserId ? 'Unable to update user.' : 'Unable to create user.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(user: User) {
    setError('');
    setDeletingUserId(user.id);

    try {
      const response = await fetch(`${apiBaseUrl}/platform-admin/users/${user.id}`, {
        method: 'DELETE',
        headers: getAdminAuthHeaders()
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setError(payload?.message ?? 'Unable to remove user.');
        return;
      }

      await loadData();
      if (editingUserId === user.id) {
        resetForm();
      }
    } catch {
      setError('Unable to remove user.');
    } finally {
      setDeletingUserId('');
    }
  }

  async function handleStatusToggle(user: User) {
    setError('');

    try {
      const response = await fetch(`${apiBaseUrl}/platform-admin/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders()
        },
        body: JSON.stringify({
          isActive: !user.isActive
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setError(payload?.message ?? 'Unable to update user status.');
        return;
      }

      await loadData();
      if (editingUserId === user.id) {
        setFormState((current) => ({
          ...current,
          isActive: !user.isActive
        }));
      }
    } catch {
      setError('Unable to update user status.');
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
      <SectionCard
        title={editingUserId ? 'Edit user' : 'Add user'}
        description="Manage tenant assignment, profile fields, and active status for platform users."
      >
        <form className="space-y-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-medium text-admin-text">Tenant</span>
            <select
              className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
              value={formState.tenantId}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  tenantId: event.target.value
                }))
              }
              required
            >
              <option value="" disabled>
                Select tenant
              </option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-admin-text">Email</span>
            <input
              className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
              value={formState.email}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  email: event.target.value
                }))
              }
              placeholder="alex.rivera@example.com"
              required
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-admin-text">
                First name
              </span>
              <input
                className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                value={formState.firstName}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    firstName: event.target.value
                  }))
                }
                placeholder="Alex"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-admin-text">
                Last name
              </span>
              <input
                className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                value={formState.lastName}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    lastName: event.target.value
                  }))
                }
                placeholder="Rivera"
                required
              />
            </label>
          </div>

          <label className="flex items-center gap-3 text-sm text-admin-text">
            <input
              type="checkbox"
              checked={formState.isActive}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  isActive: event.target.checked
                }))
              }
            />
            Active user
          </label>

          {error ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-admin-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting
                ? editingUserId
                  ? 'Saving user...'
                  : 'Creating user...'
                : editingUserId
                  ? 'Save changes'
                  : 'Add user'}
            </button>

            <button
              type="button"
              onClick={() => resetForm()}
              className="rounded-full border border-admin-border px-5 py-3 text-sm font-semibold text-admin-text transition hover:border-admin-accent hover:text-admin-accent"
            >
              {editingUserId ? 'Cancel edit' : 'Clear form'}
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="User directory"
        description="Searchable local user directory with edit, activation, and removal actions."
      >
        {isLoading ? (
          <p className="text-sm text-admin-muted">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-admin-muted">
            No users found. Add one to start managing access.
          </p>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <article
                key={user.id}
                className="rounded-2xl border border-admin-border bg-slate-50 p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-semibold text-admin-text">
                        {user.firstName} {user.lastName}
                      </h2>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                          user.isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-admin-muted">{user.email}</p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-admin-accent">
                      {user.tenant.name}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {user.roles.length > 0 ? (
                        user.roles.map((role) => (
                          <span
                            key={role}
                            className="rounded-full border border-admin-border bg-white px-3 py-1 text-xs font-medium text-admin-text"
                          >
                            {role}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-admin-muted">
                          No roles assigned
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => startEditing(user)}
                      className="rounded-full border border-admin-border px-4 py-2 text-sm font-semibold text-admin-text transition hover:border-admin-accent hover:text-admin-accent"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleStatusToggle(user)}
                      className="rounded-full border border-admin-border px-4 py-2 text-sm font-semibold text-admin-text transition hover:border-admin-accent hover:text-admin-accent"
                    >
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(user)}
                      disabled={deletingUserId === user.id}
                      className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {deletingUserId === user.id ? 'Removing...' : 'Remove'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
