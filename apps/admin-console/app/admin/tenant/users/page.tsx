import { UserListPage } from '../../../../components/user-list-page';

export const dynamic = 'force-dynamic';

export default function AdminTenantUsersPage() {
  return <UserListPage scope="tenant" />;
}
