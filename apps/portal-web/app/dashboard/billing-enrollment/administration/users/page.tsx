import { EmployerAdministratorUsers } from '../../../../../components/billing-enrollment/EmployerAdministratorUsers';
import {
  getAdminModules,
  getAdministratorsForTenant,
  getRolePermissionMatrixForTenant
} from '../../../../../lib/employer-admin-settings-data';
import { getPortalSessionUser } from '../../../../../lib/portal-session';

export default async function EmployerAdministrationUsersPage() {
  const sessionUser = await getPortalSessionUser();
  const tenantId = sessionUser?.tenant.id ?? 'unknown-tenant';

  return (
    <EmployerAdministratorUsers
      initialAdministrators={getAdministratorsForTenant(tenantId)}
      initialPermissions={getRolePermissionMatrixForTenant(tenantId)}
      modules={getAdminModules()}
    />
  );
}
