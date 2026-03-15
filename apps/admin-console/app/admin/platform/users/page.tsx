import { PlatformAdminGate } from '../../../../components/platform-admin-gate';
import { UserListPage } from '../../../../components/user-list-page';

export default function AdminPlatformUsersPage() {
  return (
    <PlatformAdminGate>
      <UserListPage scope="platform" />
    </PlatformAdminGate>
  );
}
