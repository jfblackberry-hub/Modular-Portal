import { PlatformAdminGate } from '../../../components/platform-admin-gate';
import { UserManagement } from '../../users/user-management';

export default function PlatformUsersPage() {
  return (
    <PlatformAdminGate>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-admin-accent">
            Platform
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-admin-text">
            Platform users
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-admin-muted">
            Manage users across the full multi-tenant platform, including tenant
            assignment and active status.
          </p>
        </div>

        <UserManagement />
      </div>
    </PlatformAdminGate>
  );
}
