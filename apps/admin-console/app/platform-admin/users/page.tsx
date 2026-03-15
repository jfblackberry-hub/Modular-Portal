import { PlatformAdminGate } from '../../../components/platform-admin-gate';
import { UserManagement } from '../../users/user-management';

export default function PlatformAdminUsersPage() {
  return (
    <PlatformAdminGate>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-admin-accent">
            Platform Admin
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-admin-text">
            User administration
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-admin-muted">
            Add, update, deactivate, and remove platform users from the local
            development environment.
          </p>
        </div>

        <UserManagement />
      </div>
    </PlatformAdminGate>
  );
}
