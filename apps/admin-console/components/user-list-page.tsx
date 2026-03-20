'use client';

import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

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
  const searchParams = useSearchParams();
  const queryTenantId = searchParams.get('tenantId') ?? searchParams.get('tenant_id');
  const tenantQuery = queryTenantId
    ? `?tenant_id=${encodeURIComponent(queryTenantId)}`
    : '';

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
  const [removingRoleCode, setRemovingRoleCode] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [tenantFilter, setTenantFilter] = useState('all');
  const userDirectoryWindowHeight = 'max-h-[36rem]';

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

        const hydratedUsers = hydrateUsers(usersPayload);
        setUsers(hydrateUsers(usersPayload));
        setTenants(tenantsPayload);
        setRoles(rolesPayload);
        setFormState((current) => ({
          ...current,
          tenantId: current.tenantId || tenantsPayload[0]?.id || ''
        }));
        return hydratedUsers;
      } else {
        const response = await fetch(`${apiBaseUrl}/api/tenant-admin/settings${tenantQuery}`, {
          cache: 'no-store',
          headers: getAdminAuthHeaders()
        });

        if (!response.ok) {
          throw new Error('Unable to load tenant users.');
        }

        const payload = (await response.json()) as TenantSettingsPayload;
        const hydratedUsers = hydrateUsers(payload.users);
        setUsers(hydrateUsers(payload.users));
        setTenants([{ id: payload.tenant.id, name: payload.tenant.name }]);
        setRoles(payload.roles);
        setFormState((current) => ({
          ...current,
          tenantId: payload.tenant.id
        }));
        return hydratedUsers;
      }
    } catch (nextError) {
      setUsers([]);
      setTenants([]);
      setRoles([]);
      setError(nextError instanceof Error ? nextError.message : 'Unable to load users.');
      return [];
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [scope, tenantQuery]);

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
          : `${apiBaseUrl}/api/tenant-admin/users${tenantQuery}`;
      const targetPath =
        drawerMode === 'edit' && selectedUser
          ? scope === 'platform'
            ? `${basePath}/${selectedUser.id}`
            : `${apiBaseUrl}/api/tenant-admin/users/${selectedUser.id}${tenantQuery}`
          : basePath;
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
          : `${apiBaseUrl}/api/tenant-admin/users/${user.id}${tenantQuery}`;
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
          : `${apiBaseUrl}/api/tenant-admin/users/${selectedUser.id}/roles${tenantQuery}`;

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

      const refreshedUsers = await loadData();
      const refreshedUser = refreshedUsers.find((user) => user.id === selectedUser.id) ?? selectedUser;
      setSelectedUser(refreshedUser);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to assign role.');
    } finally {
      setIsAssigningRole(false);
    }
  }

  async function handleRemoveRole(roleCode: string) {
    if (!selectedUser) {
      return;
    }

    const role = roles.find((item) => item.code === roleCode);
    if (!role) {
      setError(`Role ${roleCode} is not available for removal.`);
      return;
    }

    setRemovingRoleCode(roleCode);
    setError('');

    try {
      const basePath =
        scope === 'platform'
          ? `${apiBaseUrl}/platform-admin/users/${selectedUser.id}/roles/${role.id}`
          : `${apiBaseUrl}/api/tenant-admin/users/${selectedUser.id}/roles/${role.id}${tenantQuery}`;

      const response = await fetch(basePath, {
        method: 'DELETE',
        headers: getAdminAuthHeaders()
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(payload?.message ?? 'Unable to remove role.');
      }

      const refreshedUsers = await loadData();
      const refreshedUser = refreshedUsers.find((user) => user.id === selectedUser.id) ?? null;
      setSelectedUser(refreshedUser);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to remove role.');
    } finally {
      setRemovingRoleCode('');
    }
  }

  const title = scope === 'platform' ? 'User List' : 'Tenant Users';
  const description =
    scope === 'platform'
      ? 'Manage all users across tenants, including role assignment and account status.'
      : 'Manage users inside the active tenant, including role assignment and account status.';
  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          user.firstName,
          user.lastName,
          user.email,
          user.tenant.name,
          ...user.roles
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' ? user.isActive : !user.isActive);
      const matchesRole =
        roleFilter === 'all' || user.roles.includes(roleFilter);
      const matchesTenant =
        tenantFilter === 'all' || user.tenant.id === tenantFilter;

      return matchesSearch && matchesStatus && matchesRole && matchesTenant;
    });
  }, [roleFilter, search, statusFilter, tenantFilter, users]);
  const roleOptions = useMemo(
    () => Array.from(new Set(users.flatMap((user) => user.roles))).sort(),
    [users]
  );

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
        <div className="mb-5 grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,0.7fr))]">
          <input
            className="w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, tenant, or role"
          />
          <select
            className="w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'all' | 'active' | 'inactive')}
          >
            <option value="all">All statuses</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>
          <select
            className="w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
          >
            <option value="all">All roles</option>
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <select
            className="w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
            value={tenantFilter}
            onChange={(event) => setTenantFilter(event.target.value)}
            disabled={scope !== 'platform'}
          >
            <option value="all">All tenants</option>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <p className="text-sm text-admin-muted">Loading users...</p>
        ) : filteredUsers.length === 0 ? (
          <p className="text-sm text-admin-muted">No users available yet.</p>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-col gap-2 text-xs uppercase tracking-[0.18em] text-admin-muted sm:flex-row sm:items-center sm:justify-between">
              <p>
                Showing {filteredUsers.length} matching {filteredUsers.length === 1 ? 'user' : 'users'}
              </p>
              <p>Scrollable directory window</p>
            </div>
            <div
              className={`${userDirectoryWindowHeight} overflow-auto rounded-2xl border border-admin-border overscroll-contain`}
            >
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 z-10 border-b border-admin-border bg-white text-xs uppercase tracking-[0.2em] text-admin-muted">
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
                {filteredUsers.map((user) => (
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
        removingRoleCode={removingRoleCode}
        error={error}
        onClose={closeDrawer}
        onFormChange={setFormState}
        onSelectedRoleChange={setSelectedRoleId}
        onSubmit={handleSubmit}
        onAssignRole={() => void handleAssignRole()}
        onRemoveRole={(roleCode) => void handleRemoveRole(roleCode)}
      />
    </div>
  );
}
