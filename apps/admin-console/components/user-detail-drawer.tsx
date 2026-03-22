'use client';

import type { FormEvent } from 'react';

type UserRecord = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  tenant: {
    id: string;
    name: string;
  } | null;
  roles: string[];
  lastLogin: string | null;
};

type RoleOption = {
  id: string;
  code: string;
  name: string;
};

type TenantOption = {
  id: string;
  name: string;
};

type UserFormState = {
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
};

type UserDetailDrawerProps = {
  mode: 'create' | 'edit';
  scope: 'platform' | 'tenant';
  isOpen: boolean;
  user: UserRecord | null;
  formState: UserFormState;
  tenants: TenantOption[];
  roles: RoleOption[];
  selectedRoleId: string;
  isSubmitting: boolean;
  isAssigningRole: boolean;
  removingRoleCode: string;
  error: string;
  onClose: () => void;
  onFormChange: (nextState: UserFormState) => void;
  onSelectedRoleChange: (roleId: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onAssignRole: () => void;
  onRemoveRole: (roleCode: string) => void;
};

function formatLastLogin(value: string | null) {
  return value ? new Date(value).toLocaleString() : 'Not recorded';
}

export function UserDetailDrawer({
  mode,
  scope,
  isOpen,
  user,
  formState,
  tenants,
  roles,
  selectedRoleId,
  isSubmitting,
  isAssigningRole,
  removingRoleCode,
  error,
  onClose,
  onFormChange,
  onSelectedRoleChange,
  onSubmit,
  onAssignRole,
  onRemoveRole
}: UserDetailDrawerProps) {
  if (!isOpen) {
    return null;
  }

  const isPlatformScope = scope === 'platform';
  const isPlatformWideAccount = isPlatformScope && formState.tenantId === '';
  const canChooseInitialRole = mode === 'create' && isPlatformScope;

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-950/35 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-2xl flex-col overflow-y-auto border-l border-admin-border bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-admin-border px-6 py-5">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-admin-accent">
              {scope === 'platform' ? 'Platform User' : 'Tenant User'}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-admin-text">
              {mode === 'create' ? 'Create User' : 'Edit User'}
            </h2>
            <p className="mt-2 text-sm text-admin-muted">
              {mode === 'create'
                ? 'Create a new user record and assign access.'
                : 'Update profile, status, and role assignment.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-admin-border px-4 py-2 text-sm font-medium text-admin-text transition hover:border-admin-accent hover:text-admin-accent"
          >
            Close
          </button>
        </div>

        <div className="flex-1 space-y-6 px-6 py-6">
          {error ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          ) : null}

          {user ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-admin-border bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-admin-muted">
                  Status
                </p>
                <p className="mt-3 text-sm font-semibold text-admin-text">
                  {user.isActive ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div className="rounded-2xl border border-admin-border bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-admin-muted">
                  Last Login
                </p>
                <p className="mt-3 text-sm font-semibold text-admin-text">
                  {formatLastLogin(user.lastLogin)}
                </p>
              </div>
            </div>
          ) : null}

          <form className="space-y-5" onSubmit={onSubmit}>
            {isPlatformScope ? (
              <div className="space-y-4 rounded-2xl border border-admin-border bg-slate-50 px-4 py-4">
                <div>
                  <p className="text-sm font-medium text-admin-text">Account scope</p>
                  <p className="mt-1 text-sm text-admin-muted">
                    Choose whether this account belongs to a tenant workspace or operates at the platform level.
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() =>
                      onFormChange({
                        ...formState,
                        tenantId: formState.tenantId || tenants[0]?.id || ''
                      })
                    }
                    title="Assign this user to a specific tenant or OU."
                    aria-label="Tenant User. Assign this user to a specific tenant or OU."
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      !isPlatformWideAccount
                        ? 'border-admin-accent bg-blue-50 text-admin-text shadow-sm'
                        : 'border-admin-border bg-white text-admin-text hover:border-admin-accent'
                    }`}
                  >
                    <p className="text-sm font-semibold">Tenant User</p>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onFormChange({
                        ...formState,
                        tenantId: ''
                      })
                    }
                    title="Create an administrator account that is not tied to any single tenant."
                    aria-label="Platform User. Create an administrator account that is not tied to any single tenant."
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      isPlatformWideAccount
                        ? 'border-admin-accent bg-blue-50 text-admin-text shadow-sm'
                        : 'border-admin-border bg-white text-admin-text hover:border-admin-accent'
                    }`}
                  >
                    <p className="text-sm font-semibold">Platform User</p>
                  </button>
                </div>

                <label className="block">
                  <span className="text-sm font-medium text-admin-text">Tenant</span>
                  <select
                    className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-admin-muted"
                    value={formState.tenantId}
                    onChange={(event) =>
                      onFormChange({
                        ...formState,
                        tenantId: event.target.value
                      })
                    }
                    required={!isPlatformWideAccount}
                    disabled={isPlatformWideAccount}
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
                  <p className="mt-2 text-sm text-admin-muted">
                    {isPlatformWideAccount
                      ? 'Tenant assignment is intentionally omitted for platform-level administrator accounts.'
                      : 'Tenant admins and tenant-bound users should remain aligned to a specific tenant.'}
                  </p>
                </label>
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-admin-text">First name</span>
                <input
                  className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                  value={formState.firstName}
                  onChange={(event) =>
                    onFormChange({
                      ...formState,
                      firstName: event.target.value
                    })
                  }
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-admin-text">Last name</span>
                <input
                  className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                  value={formState.lastName}
                  onChange={(event) =>
                    onFormChange({
                      ...formState,
                      lastName: event.target.value
                    })
                  }
                  required
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-admin-text">Email</span>
              <input
                className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                type="email"
                value={formState.email}
                onChange={(event) =>
                  onFormChange({
                    ...formState,
                    email: event.target.value
                  })
                }
                required
              />
            </label>

            <label className="flex items-center gap-3 text-sm text-admin-text">
              <input
                type="checkbox"
                checked={formState.isActive}
                onChange={(event) =>
                  onFormChange({
                    ...formState,
                    isActive: event.target.checked
                  })
                }
              />
              Active user
            </label>

            {canChooseInitialRole ? (
              <label className="block">
                <span className="text-sm font-medium text-admin-text">Initial role</span>
                <select
                  className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                  value={selectedRoleId}
                  onChange={(event) => onSelectedRoleChange(event.target.value)}
                >
                  <option value="">Create without role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-sm text-admin-muted">
                  Assign a role during creation so platform administrators can be ready immediately.
                </p>
              </label>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full bg-admin-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting
                  ? mode === 'create'
                    ? 'Creating user...'
                    : 'Saving user...'
                  : mode === 'create'
                    ? 'Create user'
                    : 'Save changes'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-admin-border px-5 py-3 text-sm font-semibold text-admin-text transition hover:border-admin-accent hover:text-admin-accent"
              >
                Cancel
              </button>
            </div>
          </form>

          {user ? (
            <div className="rounded-3xl border border-admin-border bg-slate-50 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                <label className="block flex-1">
                  <span className="text-sm font-medium text-admin-text">Assign role</span>
                  <select
                    className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                    value={selectedRoleId}
                    onChange={(event) => onSelectedRoleChange(event.target.value)}
                  >
                    <option value="" disabled>
                      Select role
                    </option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  onClick={onAssignRole}
                  disabled={isAssigningRole || !selectedRoleId}
                  className="rounded-full border border-admin-border bg-white px-5 py-3 text-sm font-semibold text-admin-text transition hover:border-admin-accent hover:text-admin-accent disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isAssigningRole ? 'Assigning role...' : 'Assign role'}
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {user.roles.length > 0 ? (
                  user.roles.map((role) => (
                    <button
                      type="button"
                      key={role}
                      onClick={() => onRemoveRole(role)}
                      disabled={removingRoleCode === role}
                      className="rounded-full border border-admin-border bg-white px-3 py-1 text-xs font-medium text-admin-text transition hover:border-rose-300 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {removingRoleCode === role ? `Removing ${role}...` : `${role} Remove`}
                    </button>
                  ))
                ) : (
                  <span className="text-sm text-admin-muted">No roles assigned</span>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
