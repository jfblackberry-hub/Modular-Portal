import 'server-only';

import { getPortalSession } from './portal-session';

export async function buildPortalApiHeaders(
  init: HeadersInit = {},
  options: {
    accessToken?: string;
    tenantId?: string | null;
  } = {}
) {
  const session = await getPortalSession();
  const accessToken = options.accessToken ?? session?.accessToken ?? null;
  const tenantId =
    options.tenantId ??
    session?.user.session.tenantId ??
    session?.user.tenant.id ??
    null;
  const headers = new Headers(init);

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  if (tenantId) {
    headers.set('x-tenant-id', tenantId);
  }

  return headers;
}
