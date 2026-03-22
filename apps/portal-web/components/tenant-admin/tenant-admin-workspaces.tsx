'use client';

import Link from 'next/link';
import { useState } from 'react';

import type {
  TenantAdminWorkspaceData,
  TenantSubtenant
} from '../../lib/tenant-admin-data';
import type { TenantAdminAuditEventRecord } from '../../lib/tenant-admin-audit';
import type {
  AccessLevel,
  AdminModule,
  AdminRole,
  AdministratorUser,
  RolePermissionMatrix
} from '../../lib/employer-admin-settings-data';

function formatDateTime(value?: string) {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function StatusPill({
  label,
  tone = 'neutral'
}: {
  label: string;
  tone?: 'neutral' | 'success' | 'warning';
}) {
  const toneClass =
    tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : tone === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : 'border-slate-200 bg-slate-100 text-slate-700';

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${toneClass}`}>
      {label}
    </span>
  );
}

function WorkspaceSection({
  eyebrow,
  title,
  description,
  children
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">{description}</p>
      </section>
      {children}
    </div>
  );
}

const adminRoles: AdminRole[] = [
  'Employer Super Admin',
  'Benefits Administrator',
  'HR Administrator',
  'Billing Administrator',
  'Read Only User'
];

const accessLevels: AccessLevel[] = ['No Access', 'View', 'Edit', 'Admin'];
const notificationCategoryOptions: Array<{
  label: string;
  key: keyof TenantAdminWorkspaceData['notifications']['categories'];
}> = [
  { label: 'Enrollment notifications', key: 'enrollment' },
  { label: 'Billing notifications', key: 'billing' },
  { label: 'Compliance alerts', key: 'compliance' },
  { label: 'Document notifications', key: 'documents' }
];

export function TenantAdminDashboardWorkspace({
  summary
}: {
  summary: TenantAdminWorkspaceData['summary'];
}) {
  return (
    <WorkspaceSection
      eyebrow="Tenant Operations"
      title="Dashboard"
      description="Review tenant-wide administrative readiness, governance activity, and operational workload in one workspace."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Administrators</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{summary.administratorsCount}</p>
        </article>
        <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Active Admins</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{summary.activeAdministratorsCount}</p>
        </article>
        <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Notifications</p>
          <div className="mt-3">
            <StatusPill
              label={summary.notificationsConfigured ? 'Configured' : 'Needs Review'}
              tone={summary.notificationsConfigured ? 'success' : 'warning'}
            />
          </div>
        </article>
        <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Integrations</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{summary.integrationsConfigured}</p>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
        <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Administrative Audit</h2>
          <div className="mt-4 space-y-3">
            {summary.auditEvents.slice(0, 4).map((event) => (
              <div key={event.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-950">{event.actionType}</p>
                  <p className="text-xs text-slate-500">{formatDateTime(event.timestamp)}</p>
                </div>
                <p className="mt-1 text-sm text-slate-600">{event.actor}</p>
                <p className="mt-1 text-sm text-slate-500">{event.affectedItem}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Workspace Shortcuts</h2>
          <div className="mt-4 grid gap-3">
            {[
              { href: '/tenant-admin/configuration', label: 'Configuration' },
              { href: '/tenant-admin/users', label: 'User Management' },
              { href: '/tenant-admin/roles', label: 'Role Management' },
              { href: '/tenant-admin/subtenants', label: 'Sub-Tenants' }
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </article>
      </section>
    </WorkspaceSection>
  );
}

export function TenantAdminConfigurationWorkspace({
  profile,
  notifications,
  billingPreferences
}: Pick<TenantAdminWorkspaceData, 'profile' | 'notifications' | 'billingPreferences'>) {
  const [profileState, setProfileState] = useState(profile);
  const [notificationState, setNotificationState] = useState(notifications);
  const [billingState, setBillingState] = useState(billingPreferences);
  const [message, setMessage] = useState('');

  function saveConfiguration() {
    setMessage('Tenant configuration saved (shared service placeholder).');
  }

  return (
    <WorkspaceSection
      eyebrow="Configuration"
      title="Tenant Configuration"
      description="Manage tenant profile, notification defaults, and billing contacts from the dedicated tenant-admin workspace."
    >
      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Tenant Profile</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Tenant Name</span>
            <input value={profileState.employerName} onChange={(event) => setProfileState((current) => ({ ...current, employerName: event.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" />
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Tenant ID</span>
            <input value={profileState.employerId} onChange={(event) => setProfileState((current) => ({ ...current, employerId: event.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" />
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Primary Contact</span>
            <input value={profileState.primaryContactName} onChange={(event) => setProfileState((current) => ({ ...current, primaryContactName: event.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" />
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Primary Contact Email</span>
            <input value={profileState.primaryContactEmail} onChange={(event) => setProfileState((current) => ({ ...current, primaryContactEmail: event.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" />
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Billing Address</span>
            <input value={profileState.billingAddress} onChange={(event) => setProfileState((current) => ({ ...current, billingAddress: event.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" />
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Headquarters Address</span>
            <input value={profileState.headquartersAddress} onChange={(event) => setProfileState((current) => ({ ...current, headquartersAddress: event.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" />
          </label>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Notification Defaults</h2>
          <div className="mt-4 grid gap-3">
            {notificationCategoryOptions.map(({ label, key }) => (
              <label key={key} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={notificationState.categories[key]}
                  onChange={(event) =>
                    setNotificationState((current) => ({
                      ...current,
                      categories: {
                        ...current.categories,
                        [key]: event.target.checked
                      }
                    }))
                  }
                  className="mr-2"
                />
                {label}
              </label>
            ))}
          </div>
        </article>

        <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Billing Contacts</h2>
          <div className="mt-4 grid gap-4">
            <label>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Billing Contact</span>
              <input value={billingState.billingContactName} onChange={(event) => setBillingState((current) => ({ ...current, billingContactName: event.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" />
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Billing Email</span>
              <input value={billingState.billingContactEmail} onChange={(event) => setBillingState((current) => ({ ...current, billingContactEmail: event.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" />
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Payment Method</span>
              <select value={billingState.preferredPaymentMethod} onChange={(event) => setBillingState((current) => ({ ...current, preferredPaymentMethod: event.target.value as typeof current.preferredPaymentMethod }))} className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm">
                <option value="ACH">ACH</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Wire Transfer">Wire Transfer</option>
              </select>
            </label>
          </div>
        </article>
      </section>

      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
        <button type="button" onClick={saveConfiguration} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
          Save Tenant Configuration
        </button>
        {message ? <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}
      </section>
    </WorkspaceSection>
  );
}

export function TenantAdminUsersWorkspace({
  administrators
}: Pick<TenantAdminWorkspaceData, 'administrators'>) {
  const [adminUsers, setAdminUsers] = useState(administrators);
  const [message, setMessage] = useState('');
  const [draftUser, setDraftUser] = useState({
    userName: '',
    email: '',
    role: 'Benefits Administrator' as AdminRole
  });

  function addAdministrator() {
    if (!draftUser.userName.trim() || !draftUser.email.trim()) {
      setMessage('Provide a user name and email before adding a tenant administrator.');
      return;
    }

    const nextUser: AdministratorUser = {
      id: `tenant-admin-${adminUsers.length + 1}`,
      userName: draftUser.userName,
      email: draftUser.email,
      role: draftUser.role,
      status: 'Active'
    };

    setAdminUsers((current) => [nextUser, ...current]);
    setDraftUser({ userName: '', email: '', role: 'Benefits Administrator' });
    setMessage('Tenant administrator added (shared service placeholder).');
  }

  function updateRole(id: string, role: AdminRole) {
    setAdminUsers((current) =>
      current.map((item) => (item.id === id ? { ...item, role } : item))
    );
    setMessage('Tenant administrator role updated.');
  }

  function deactivateAdministrator(id: string) {
    setAdminUsers((current) =>
      current.map((item) => (item.id === id ? { ...item, status: 'Disabled' } : item))
    );
    setMessage('Tenant administrator deactivated.');
  }

  return (
    <WorkspaceSection
      eyebrow="Users"
      title="User Management"
      description="Manage tenant-scoped administrators and operators without entering employer or billing portal administration surfaces."
    >
      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Add Tenant Administrator</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input value={draftUser.userName} onChange={(event) => setDraftUser((current) => ({ ...current, userName: event.target.value }))} className="h-11 rounded-xl border border-slate-200 px-3 text-sm" placeholder="User name" />
          <input value={draftUser.email} onChange={(event) => setDraftUser((current) => ({ ...current, email: event.target.value }))} className="h-11 rounded-xl border border-slate-200 px-3 text-sm" placeholder="Email" />
          <select value={draftUser.role} onChange={(event) => setDraftUser((current) => ({ ...current, role: event.target.value as AdminRole }))} className="h-11 rounded-xl border border-slate-200 px-3 text-sm">
            {adminRoles.map((role) => <option key={role} value={role}>{role}</option>)}
          </select>
        </div>
        <button type="button" onClick={addAdministrator} className="mt-4 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
          Add User
        </button>
        {message ? <p className="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">{message}</p> : null}
      </section>

      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Current Administrators</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.14em] text-slate-500">
                <th className="px-3 py-3">Name</th>
                <th className="px-3 py-3">Email</th>
                <th className="px-3 py-3">Role</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Last Login</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {adminUsers.map((administrator) => (
                <tr key={administrator.id} className="border-b border-slate-200">
                  <td className="px-3 py-4 font-medium text-slate-950">{administrator.userName}</td>
                  <td className="px-3 py-4 text-slate-600">{administrator.email}</td>
                  <td className="px-3 py-4">
                    <select value={administrator.role} onChange={(event) => updateRole(administrator.id, event.target.value as AdminRole)} className="h-10 rounded-xl border border-slate-200 px-3 text-sm">
                      {adminRoles.map((role) => <option key={role} value={role}>{role}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-4">
                    <StatusPill label={administrator.status} tone={administrator.status === 'Active' ? 'success' : 'warning'} />
                  </td>
                  <td className="px-3 py-4 text-slate-600">{formatDateTime(administrator.lastLogin)}</td>
                  <td className="px-3 py-4">
                    <button type="button" onClick={() => deactivateAdministrator(administrator.id)} className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700">
                      Deactivate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </WorkspaceSection>
  );
}

export function TenantAdminRolesWorkspace({
  rolePermissions,
  adminModules
}: Pick<TenantAdminWorkspaceData, 'rolePermissions' | 'adminModules'>) {
  const [permissions, setPermissions] = useState<RolePermissionMatrix>(rolePermissions);
  const [message, setMessage] = useState('');

  function updatePermission(role: AdminRole, module: AdminModule, accessLevel: AccessLevel) {
    setPermissions((current) => ({
      ...current,
      [role]: {
        ...current[role],
        [module]: accessLevel
      }
    }));
    setMessage('Role permissions updated.');
  }

  return (
    <WorkspaceSection
      eyebrow="Roles"
      title="Role Management"
      description="Manage tenant role definitions and module access from a single permission matrix."
    >
      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.14em] text-slate-500">
                <th className="px-3 py-3">Role</th>
                {adminModules.map((module) => (
                  <th key={module} className="px-3 py-3">{module}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {adminRoles.map((role) => (
                <tr key={role} className="border-b border-slate-200">
                  <td className="px-3 py-4 font-medium text-slate-950">{role}</td>
                  {adminModules.map((module) => (
                    <td key={`${role}-${module}`} className="px-3 py-4">
                      <select value={permissions[role][module]} onChange={(event) => updatePermission(role, module, event.target.value as AccessLevel)} className="h-10 rounded-xl border border-slate-200 px-3 text-sm">
                        {accessLevels.map((level) => <option key={level} value={level}>{level}</option>)}
                      </select>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {message ? <p className="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">{message}</p> : null}
      </section>
    </WorkspaceSection>
  );
}

function SubtenantCard({ item }: { item: TenantSubtenant }) {
  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{item.name}</h2>
          <p className="mt-1 text-sm text-slate-500">{item.id}</p>
        </div>
        <StatusPill
          label={item.status}
          tone={item.status === 'Active' ? 'success' : 'warning'}
        />
      </div>
      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Members</dt>
          <dd className="mt-1 text-lg font-semibold text-slate-950">{item.memberCount}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Admins</dt>
          <dd className="mt-1 text-lg font-semibold text-slate-950">{item.adminCount}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Last Updated</dt>
          <dd className="mt-1 text-sm text-slate-600">{formatDateTime(item.lastUpdated)}</dd>
        </div>
      </dl>
    </article>
  );
}

export function TenantAdminSubtenantsWorkspace({
  subtenants
}: Pick<TenantAdminWorkspaceData, 'subtenants'>) {
  return (
    <WorkspaceSection
      eyebrow="Sub-Tenants"
      title="Sub-Tenant Management"
      description="Review delegated tenant partitions and manage scoped administrative boundaries without exposing adjacent tenant populations."
    >
      <section className="grid gap-4 xl:grid-cols-2">
        {subtenants.map((item) => <SubtenantCard key={item.id} item={item} />)}
      </section>
    </WorkspaceSection>
  );
}

export function TenantAdminIntegrationsWorkspace({
  integrations
}: Pick<TenantAdminWorkspaceData, 'integrations'>) {
  const [message, setMessage] = useState('');

  return (
    <WorkspaceSection
      eyebrow="Integrations"
      title="Integration Management"
      description="Monitor tenant-level external connectors from the isolated tenant-admin workspace."
    >
      {message ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {integrations.map((integration) => (
          <article key={integration.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-950">{integration.provider}</h2>
              <StatusPill
                label={integration.status}
                tone={integration.status === 'Configured' ? 'success' : integration.status === 'Connection Error' ? 'warning' : 'neutral'}
              />
            </div>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{integration.category}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{integration.notes}</p>
            <button type="button" onClick={() => setMessage(`${integration.provider} connector settings saved (shared service placeholder).`)} className="mt-4 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
              Save Connector
            </button>
          </article>
        ))}
      </section>
    </WorkspaceSection>
  );
}

export function TenantAdminAuditWorkspace({
  auditEvents
}: {
  auditEvents: TenantAdminAuditEventRecord[];
}) {
  return (
    <WorkspaceSection
      eyebrow="Audit"
      title="Audit Logs"
      description="Review tenant-scoped administrative actions and settings changes from the dedicated control plane."
    >
      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="space-y-3">
          {auditEvents.map((event) => (
            <div key={event.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-slate-950">{event.eventType}</p>
                <p className="text-xs text-slate-500">{formatDateTime(event.timestamp)}</p>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <StatusPill label={`Resource: ${event.resourceType}`} />
                {event.userId ? <StatusPill label={`User: ${event.userId}`} /> : null}
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {event.resourceId ? `Resource ID: ${event.resourceId}` : 'Resource ID unavailable'}
              </p>
              <div className="mt-3 grid gap-3 xl:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Before</p>
                  <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words text-xs leading-6 text-slate-600">
                    {JSON.stringify(event.beforeState ?? {}, null, 2)}
                  </pre>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">After</p>
                  <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words text-xs leading-6 text-slate-600">
                    {JSON.stringify(event.afterState ?? {}, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          ))}
          {auditEvents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
              No tenant-admin audit events found for the current tenant.
            </div>
          ) : null}
        </div>
      </section>
    </WorkspaceSection>
  );
}
