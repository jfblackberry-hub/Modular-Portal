'use client';

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';

import { UserDetailDrawer } from './user-detail-drawer';
import { SectionCard } from './section-card';
import { apiBaseUrl, getAdminAuthHeaders } from '../lib/api-auth';

type Scope = 'platform' | 'tenant';

type UserRecord = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  tenant: {
    id: string;
    name: string;
  };
  roles: string[];
  permissions: string[];
  lastLogin: string | null;
};

type TenantOption = {
  id: string;
  name: string;
};

type RoleOption = {
  id: string;
  code: string;
  name: string;
};

type UserFormState = {
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
};

type ApiUserRecord = Omit<UserRecord, 'lastLogin'> & {
  lastLoginAt?: string | null;
};

type TenantSettingsPayload = {
  tenant: {
    id: string;
    name: string;
  };
  users: ApiUserRecord[];
  roles: RoleOption[];
};

type PlatformUsersPayload = ApiUserRecord[];

const emptyFormState: UserFormState = {
  tenantId: '',
  firstName: '',
  lastName: '',
  email: '',
  isActive: true
};

function formatLastLogin(value: string | null) {
  return value ? new Date(value).toLocaleString() : 'Not recorded';
}

function hydrateUsers(users: ApiUserRecord[]): UserRecord[] {
  return users.map((user) => ({
    ...user,
    lastLogin: user.lastLoginAt ?? null
  }));
}

export function UserListPage({ scope }: { scope: Scope }) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');
  const [formState, setFormState] = useState<UserFormState>(emptyFormState);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAssigningRole, setIsAssigningRole] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState('');

  async function loadData() {
    setIsLoading(true);
    setError('');

    try {
      if (scope === 'platform') {
        const [usersResponse, tenantsResponse, rolesResponse] = await Promise.all([
          fetch(`${apiBaseUrl}/platform-admin/users`, {
            cache: 'no-store',
            headers: getAdminAuthHeaders()
          }),
          fetch(`${apiBaseUrl}/platform-admin/tenants`, {
            cache: 'no-store',
            headers: getAdminAuthHeaders()
          }),
          fetch(`${apiBaseUrl}/platform-admin/roles`, {
            cache: 'no-store',
            headers: getAdminAuthHeaders()
          })
        ]);

        if (!usersResponse.ok || !tenantsResponse.ok || !rolesResponse.ok) {
          throw new Error('Unable to load platform users.');
        }

        const [usersPayload, tenantsPayload, rolesPayload] = (await Promise.all([
          usersResponse.json(),
          tenantsResponse.json(),
          rolesResponse.json()
        ])) as [PlatformUsersPayload, TenantOption[], RoleOption[]];

        setUsers(hydrateUsers(usersPayload));
        setTenants(tenantsPayload);
        setRoles(rolesPayload);
        setFormState((current) => ({
          ...current,
          tenantId: current.tenantId || tenantsPayload[0]?.id || ''
        }));
      } else {
        const response = await fetch(`${apiBaseUrl}/api/tenant-admin/settings`, {
          cache: 'no-store',
          headers: getAdminAuthHeaders()
        });

        if (!response.ok) {
          throw new Error('Unable to load tenant users.');
        }

        const payload = (await response.json()) as TenantSettingsPayload;
        setUsers(hydrateUsers(payload.users));
        setTenants([{ id: payload.tenant.id, name: payload.tenant.name }]);
        setRoles(payload.roles);
        setFormState((current) => ({
          ...current,
          tenantId: payload.tenant.id
        }));
      }
    } catch (nextError) {
      setUsers([]);
      setTenants([]);
      setRoles([]);
      setError(nextError instanceof Error ? nextError.message : 'Unable to load users.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [scope]);

  function closeDrawer() {
    setIsDrawerOpen(false);
    setSelectedUser(null);
    setSelectedRoleId('');
    setFormState({
      ...emptyFormState,
      tenantId: scope === 'platform' ? tenants[0]?.id ?? '' : tenants[0]?.id ?? ''
    });
    setError('');
  }

  function openCreateDrawer() {
    setDrawerMode('create');
    setSelectedUser(null);
    setSelectedRoleId(roles[0]?.id ?? '');
    setFormState({
      ...emptyFormState,
      tenantId: scope === 'platform' ? tenants[0]?.id ?? '' : tenants[0]?.id ?? ''
    });
    setError('');
    setIsDrawerOpen(true);
  }

  function openEditDrawer(user: UserRecord) {
    setDrawerMode('edit');
    setSelectedUser(user);
    setSelectedRoleId(roles[0]?.id ?? '');
    setFormState({
      tenantId: user.tenant.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isActive: user.isActive
    });
    setError('');
    setIsDrawerOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const basePath =
        scope === 'platform'
          ? `${apiBaseUrl}/platform-admin/users`
          : `${apiBaseUrl}/api/tenant-admin/users`;
      const targetPath =
        drawerMode === 'edit' && selectedUser ? `${basePath}/${selectedUser.id}` : basePath;
      const method = drawerMode === 'edit' ? 'PATCH' : 'POST';
      const body =
        scope === 'platform'
          ? formState
          : {
              email: formState.email,
              firstName: formState.firstName,
              lastName: formState.lastName,
              isActive: formState.isActive
            };

      const response = await fetch(targetPath, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders()
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(payload?.message ?? 'Unable to save user.');
      }

      await loadData();
      closeDrawer();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to save user.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeactivate(user: UserRecord) {
    setUpdatingUserId(user.id);
    setError('');

    try {
      const basePath =
        scope === 'platform'
          ? `${apiBaseUrl}/platform-admin/users/${user.id}`
          : `${apiBaseUrl}/api/tenant-admin/users/${user.id}`;
      const response = await fetch(basePath, {
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
        throw new Error(payload?.message ?? 'Unable to update user status.');
      }

      await loadData();
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : 'Unable to update user status.'
      );
    } finally {
      setUpdatingUserId('');
    }
  }

  async function handleAssignRole() {
    if (!selectedUser || !selectedRoleId) {
      return;
    }

    setIsAssigningRole(true);
    setError('');

    try {
      const basePath =
        scope === 'platform'
          ? `${apiBaseUrl}/platform-admin/users/${selectedUser.id}/roles`
          : `${apiBaseUrl}/api/tenant-admin/users/${selectedUser.id}/roles`;

      const response = await fetch(basePath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders()
        },
        body: JSON.stringify({
          roleId: selectedRoleId
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(payload?.message ?? 'Unable to assign role.');
      }

      await loadData();
      const refreshedUser = users.find((user) => user.id === selectedUser.id) ?? selectedUser;
      setSelectedUser(refreshedUser);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to assign role.');
    } finally {
      setIsAssigningRole(false);
    }
  }

  const title = scope === 'platform' ? 'User List' : 'Tenant Users';
  const description =
    scope === 'platform'
      ? 'Manage all users across tenants, including role assignment and account status.'
      : 'Manage users inside the active tenant, including role assignment and account status.';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-admin-accent">
            {scope === 'platform' ? 'Platform' : 'Tenant'}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-admin-text">
            {title}
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-admin-muted">
            {description}
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateDrawer}
          className="rounded-full bg-admin-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Create User
        </button>
      </div>

      {error && !isDrawerOpen ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <SectionCard
        title="User directory"
        description="Includes create, edit, deactivate, and assign-role workflows."
      >
        {isLoading ? (
          <p className="text-sm text-admin-muted">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-admin-muted">No users available yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-admin-border text-xs uppercase tracking-[0.2em] text-admin-muted">
                <tr>
                  <th className="px-3 py-3">Name</th>
                  <th className="px-3 py-3">Email</th>
                  <th className="px-3 py-3">Role</th>
                  <th className="px-3 py-3">Tenant</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Last Login</th>
                  <th className="px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-admin-border/70">
                    <td className="px-3 py-4 font-medium text-admin-text">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="px-3 py-4 text-admin-muted">{user.email}</td>
                    <td className="px-3 py-4 text-admin-text">
                      {user.roles[0] ?? 'Unassigned'}
                    </td>
                    <td className="px-3 py-4 text-admin-text">
                      {scope === 'platform' ? user.tenant.name : 'Current tenant'}
                    </td>
                    <td className="px-3 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                          user.isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-admin-muted">
                      {formatLastLogin(user.lastLogin)}
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openEditDrawer(user)}
                          className="rounded-full border border-admin-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-admin-text transition hover:border-admin-accent hover:text-admin-accent"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeactivate(user)}
                          disabled={updatingUserId === user.id}
                          className="rounded-full border border-admin-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-admin-text transition hover:border-admin-accent hover:text-admin-accent disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {updatingUserId === user.id
                            ? 'Saving...'
                            : user.isActive
                              ? 'Deactivate'
                              : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <UserDetailDrawer
        mode={drawerMode}
        scope={scope}
        isOpen={isDrawerOpen}
        user={selectedUser}
        formState={formState}
        tenants={tenants}
        roles={roles}
        selectedRoleId={selectedRoleId}
        isSubmitting={isSubmitting}
        isAssigningRole={isAssigningRole}
        error={error}
        onClose={closeDrawer}
        onFormChange={setFormState}
        onSelectedRoleChange={setSelectedRoleId}
        onSubmit={handleSubmit}
        onAssignRole={() => void handleAssignRole()}
      />
    </div>
  );
}
