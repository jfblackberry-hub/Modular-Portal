'use client';

import { useState } from 'react';

import type { AccessLevel, AdminModule, AdminRole, AdministratorUser, RolePermissionMatrix } from '../../lib/employer-admin-settings-data';
import { EmptyState, StatusBadge } from '../portal-ui';

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

const roles: AdminRole[] = [
  'Employer Super Admin',
  'Benefits Administrator',
  'HR Administrator',
  'Billing Administrator',
  'Read Only User'
];

const accessLevels: AccessLevel[] = ['No Access', 'View', 'Edit', 'Admin'];

export function EmployerAdministratorUsers({
  initialAdministrators,
  initialPermissions,
  modules
}: {
  initialAdministrators: AdministratorUser[];
  initialPermissions: RolePermissionMatrix;
  modules: AdminModule[];
}) {
  const [administrators, setAdministrators] = useState(initialAdministrators);
  const [permissions, setPermissions] = useState(initialPermissions);
  const [message, setMessage] = useState('');
  const [newAdmin, setNewAdmin] = useState({
    userName: '',
    email: '',
    role: 'Benefits Administrator' as AdminRole
  });

  function addAdministrator() {
    if (!newAdmin.userName.trim() || !newAdmin.email.trim()) {
      setMessage('Provide user name and email to add an administrator.');
      return;
    }

    const nextAdministrator: AdministratorUser = {
      id: `temp-admin-${administrators.length + 1}`,
      userName: newAdmin.userName,
      email: newAdmin.email,
      role: newAdmin.role,
      status: 'Active',
      lastLogin: undefined
    };

    setAdministrators((current) => [nextAdministrator, ...current]);
    setNewAdmin({ userName: '', email: '', role: 'Benefits Administrator' });
    setMessage('Administrator added (mock action with audit log event).');
  }

  function deactivateAdministrator(id: string) {
    setAdministrators((current) =>
      current.map((administrator) =>
        administrator.id === id
          ? {
              ...administrator,
              status: 'Disabled'
            }
          : administrator
      )
    );
    setMessage('Administrator account deactivated.');
  }

  function changeRole(id: string, role: AdminRole) {
    setAdministrators((current) =>
      current.map((administrator) =>
        administrator.id === id ? { ...administrator, role } : administrator
      )
    );
    setMessage('Administrator role updated.');
  }

  function changePermission(role: AdminRole, module: AdminModule, nextLevel: AccessLevel) {
    setPermissions((current) => ({
      ...current,
      [role]: {
        ...current[role],
        [module]: nextLevel
      }
    }));
    setMessage('Role permissions updated.');
  }

  return (
    <div className="space-y-5">
      <section className="portal-card p-6 sm:p-8">
        <p className="text-[13px] font-medium text-[var(--tenant-primary-color)]">Administration</p>
        <h1 className="mt-2 text-[28px] font-semibold leading-tight text-[var(--text-primary)] sm:text-[32px]">Administrator Users</h1>
      </section>

      <section className="portal-card p-5">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Add Administrator</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <input value={newAdmin.userName} onChange={(event) => setNewAdmin((current) => ({ ...current, userName: event.target.value }))} className="h-11 rounded-xl border border-[var(--border-subtle)] px-3 text-sm" placeholder="User Name" />
          <input value={newAdmin.email} onChange={(event) => setNewAdmin((current) => ({ ...current, email: event.target.value }))} className="h-11 rounded-xl border border-[var(--border-subtle)] px-3 text-sm" placeholder="Email" />
          <select value={newAdmin.role} onChange={(event) => setNewAdmin((current) => ({ ...current, role: event.target.value as AdminRole }))} className="h-11 rounded-xl border border-[var(--border-subtle)] px-3 text-sm">
            {roles.map((role) => (<option key={role} value={role}>{role}</option>))}
          </select>
        </div>
        <button type="button" onClick={addAdministrator} className="mt-4 inline-flex min-h-10 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-4 py-2 text-sm font-semibold text-white">Add Administrator User</button>
        {message ? <p className="mt-3 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">{message}</p> : null}
      </section>

      <section className="portal-card p-5">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Current Administrators</h2>
        {administrators.length === 0 ? (
          <div className="mt-4"><EmptyState title="No administrators configured" description="Add an administrator to begin managing organization settings." /></div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="portal-data-table w-full border-collapse bg-white text-sm">
              <thead>
                <tr>
                  <th>User Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {administrators.map((administrator) => (
                  <tr key={administrator.id}>
                    <td>{administrator.userName}</td>
                    <td>{administrator.email}</td>
                    <td>
                      <select value={administrator.role} onChange={(event) => changeRole(administrator.id, event.target.value as AdminRole)} className="h-9 rounded-lg border border-[var(--border-subtle)] px-2 text-xs">
                        {roles.map((role) => (<option key={role} value={role}>{role}</option>))}
                      </select>
                    </td>
                    <td><StatusBadge label={administrator.status} /></td>
                    <td>{formatDateTime(administrator.lastLogin)}</td>
                    <td>
                      <button type="button" onClick={() => deactivateAdministrator(administrator.id)} className="rounded-full border border-rose-300 px-2.5 py-1 text-xs font-semibold text-rose-700">
                        Deactivate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="portal-card p-5">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Role Permissions Matrix</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="portal-data-table w-full border-collapse bg-white text-sm">
            <thead>
              <tr>
                <th>Role</th>
                {modules.map((module) => (
                  <th key={module}>{module}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role}>
                  <td>{role}</td>
                  {modules.map((module) => (
                    <td key={`${role}-${module}`}>
                      <select value={permissions[role][module]} onChange={(event) => changePermission(role, module, event.target.value as AccessLevel)} className="h-9 rounded-lg border border-[var(--border-subtle)] px-2 text-xs">
                        {accessLevels.map((level) => (<option key={level} value={level}>{level}</option>))}
                      </select>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
