import { redirect } from 'next/navigation';

import { getPortalSessionUser } from './portal-session';

const TENANT_ADMIN_ROLE_SET = new Set([
  'tenant_admin',
  'TENANT_ADMIN',
  'tenant_operator',
  'TENANT_OPERATOR'
]);

export async function getTenantAdminSessionContext() {
  const user = await getPortalSessionUser();

  if (!user) {
    redirect('/login');
  }

  const hasTenantAdminRole = user.roles.some((role) => TENANT_ADMIN_ROLE_SET.has(role));
  const sessionType = user.session.type;
  const tenantId = user.session.tenantId;

  if (!hasTenantAdminRole || sessionType !== 'tenant_admin' || !tenantId) {
    redirect('/login');
  }

  return {
    user,
    tenantId,
    tenantName: user.tenant.name
  };
}
