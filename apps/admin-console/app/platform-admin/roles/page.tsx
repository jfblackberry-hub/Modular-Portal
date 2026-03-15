import { PlatformAdminGate } from '../../../components/platform-admin-gate';
import { RoleManagement } from '../../roles/role-management';

export default function PlatformAdminRolesPage() {
  return (
    <PlatformAdminGate>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-admin-accent">
            Platform Admin
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-admin-text">
            RBAC management
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-admin-muted">
            Create roles, attach permissions, and assign roles to users in the
            local development environment.
          </p>
        </div>

        <RoleManagement />
      </div>
    </PlatformAdminGate>
  );
}
