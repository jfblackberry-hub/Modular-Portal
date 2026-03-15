import { PlatformAdminGate } from '../../../../components/platform-admin-gate';
import { RoleManagement } from '../../../roles/role-management';

export default function AdminPlatformRolesPage() {
  return (
    <PlatformAdminGate>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-admin-accent">
            Platform
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-admin-text">
            Role management
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-admin-muted">
            Maintain platform RBAC definitions and assign roles across the shared tenant landscape.
          </p>
        </div>

        <RoleManagement />
      </div>
    </PlatformAdminGate>
  );
}
