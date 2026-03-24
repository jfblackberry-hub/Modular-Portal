'use client';

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';

import { SectionCard } from '../../components/section-card';
import { config, getAdminAuthHeaders } from '../../lib/api-auth';

type Role = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  permissions: string[];
  users: Array<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  }>;
};

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tenant: {
    id: string;
    name: string;
  };
  roles: string[];
  permissions: string[];
};

export function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState(
    'admin.manage, tenant.view, member.view'
  );
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  async function loadData() {
    setIsLoading(true);
    setError('');

    try {
      const [rolesResponse, usersResponse] = await Promise.all([
        fetch(`${config.apiBaseUrl}/platform-admin/roles`, {
          cache: 'no-store',
          headers: getAdminAuthHeaders()
        }),
        fetch(`${config.apiBaseUrl}/platform-admin/users`, {
          cache: 'no-store',
          headers: getAdminAuthHeaders()
        })
      ]);

      if (!rolesResponse.ok || !usersResponse.ok) {
        const payload =
          ((await rolesResponse.json().catch(() => null)) as {
            message?: string;
          } | null) ??
          ((await usersResponse.json().catch(() => null)) as {
            message?: string;
          } | null);

        setError(payload?.message ?? 'Unable to load RBAC data.');
        setRoles([]);
        setUsers([]);
        return;
      }

      const [rolesPayload, usersPayload] = (await Promise.all([
        rolesResponse.json(),
        usersResponse.json()
      ])) as [Role[], User[]];

      setRoles(rolesPayload);
      setUsers(usersPayload);
      setSelectedUserId((current) => current || usersPayload[0]?.id || '');
      setSelectedRoleId((current) => current || rolesPayload[0]?.id || '');
    } catch {
      setError('API unavailable. Start the local API and try again.');
      setRoles([]);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleCreateRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsCreating(true);

    try {
      const permissionList = permissions
        .split(',')
        .map((permission) => permission.trim())
        .filter(Boolean);

      const response = await fetch(`${config.apiBaseUrl}/platform-admin/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders()
        },
        body: JSON.stringify({
          code,
          name,
          description,
          permissions: permissionList
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setError(payload?.message ?? 'Unable to create role.');
        return;
      }

      setCode('');
      setName('');
      setDescription('');
      setPermissions('admin.manage, tenant.view, member.view');
      await loadData();
    } catch {
      setError('Unable to create role.');
    } finally {
      setIsCreating(false);
    }
  }

  async function handleAssignRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsAssigning(true);

    try {
      const response = await fetch(
        `${config.apiBaseUrl}/platform-admin/users/${selectedUserId}/roles`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAdminAuthHeaders()
          },
          body: JSON.stringify({
            roleId: selectedRoleId
          })
        }
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setError(payload?.message ?? 'Unable to assign role.');
        return;
      }

      await loadData();
    } catch {
      setError('Unable to assign role.');
    } finally {
      setIsAssigning(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Create role"
          description="Create a role and attach permission codes."
        >
          <form className="space-y-5" onSubmit={handleCreateRole}>
            <label className="block">
              <span className="text-sm font-medium text-admin-text">
                Role code
              </span>
              <input
                className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="claims-admin"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-admin-text">
                Role name
              </span>
              <input
                className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Claims Admin"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-admin-text">
                Description
              </span>
              <input
                className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Manages claims operations."
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-admin-text">
                Permissions
              </span>
              <input
                className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                value={permissions}
                onChange={(event) => setPermissions(event.target.value)}
                placeholder="admin.manage, tenant.view"
                required
              />
            </label>

            <button
              type="submit"
              disabled={isCreating}
              className="rounded-full bg-admin-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isCreating ? 'Creating role...' : 'Create role'}
            </button>
          </form>
        </SectionCard>

        <SectionCard
          title="Assign role"
          description="Assign an existing role to a user and refresh effective permissions."
        >
          <form className="space-y-5" onSubmit={handleAssignRole}>
            <label className="block">
              <span className="text-sm font-medium text-admin-text">User</span>
              <select
                className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                value={selectedUserId}
                onChange={(event) => setSelectedUserId(event.target.value)}
                required
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.email})
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-admin-text">Role</span>
              <select
                className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                value={selectedRoleId}
                onChange={(event) => setSelectedRoleId(event.target.value)}
                required
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name} ({role.code})
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              disabled={isAssigning || !selectedUserId || !selectedRoleId}
              className="rounded-full bg-admin-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isAssigning ? 'Assigning role...' : 'Assign role to user'}
            </button>
          </form>

          {error ? (
            <p className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          ) : null}
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Roles"
          description="Current roles and their attached permissions."
        >
          {isLoading ? (
            <p className="text-sm text-admin-muted">Loading roles...</p>
          ) : (
            <div className="space-y-4">
              {roles.map((role) => (
                <article
                  key={role.id}
                  className="rounded-2xl border border-admin-border bg-slate-50 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-admin-text">
                        {role.name}
                      </h2>
                      <p className="mt-1 font-mono text-xs text-admin-muted">
                        {role.code}
                      </p>
                    </div>
                    <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-admin-accent">
                      {role.permissions.length} permissions
                    </span>
                  </div>
                  {role.description ? (
                    <p className="mt-3 text-sm text-admin-muted">
                      {role.description}
                    </p>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {role.permissions.map((permission) => (
                      <span
                        key={permission}
                        className="rounded-full border border-admin-border bg-white px-3 py-1 text-xs font-medium text-admin-text"
                      >
                        {permission}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Users"
          description="Effective permissions resolve from the roles assigned to each user."
        >
          {isLoading ? (
            <p className="text-sm text-admin-muted">Loading users...</p>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <article
                  key={user.id}
                  className="rounded-2xl border border-admin-border bg-slate-50 p-5"
                >
                  <h2 className="text-lg font-semibold text-admin-text">
                    {user.firstName} {user.lastName}
                  </h2>
                  <p className="mt-1 text-sm text-admin-muted">{user.email}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-admin-accent">
                    {user.tenant.name}
                  </p>

                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-admin-muted">
                      Roles
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
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

                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-admin-muted">
                      Effective permissions
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {user.permissions.length > 0 ? (
                        user.permissions.map((permission) => (
                          <span
                            key={permission}
                            className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-admin-accent"
                          >
                            {permission}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-admin-muted">
                          No permissions resolved
                        </span>
                      )}
                    </div>
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
