import {
  CookieJar,
  expectHttpStatus,
  printCheck
} from './local-stack-harness.mjs';

const REQUIRED_RELEASE_ENV = [
  'RELEASE_ADMIN_EMAIL',
  'RELEASE_PORTAL_MEMBER_EMAIL',
  'RELEASE_PORTAL_TENANT_ADMIN_EMAIL',
  'RELEASE_VALIDATION_PASSWORD'
];

function readReleaseCredentials(env = process.env) {
  return {
    memberEmail: env.RELEASE_PORTAL_MEMBER_EMAIL?.trim() ?? '',
    tenantAdminEmail: env.RELEASE_PORTAL_TENANT_ADMIN_EMAIL?.trim() ?? '',
    adminEmail: env.RELEASE_ADMIN_EMAIL?.trim() ?? '',
    password: env.RELEASE_VALIDATION_PASSWORD?.trim() ?? ''
  };
}

export function getAuthenticatedReleaseCoverage(env = process.env) {
  const credentials = readReleaseCredentials(env);
  const missingVariables = REQUIRED_RELEASE_ENV.filter((name) => {
    switch (name) {
      case 'RELEASE_PORTAL_MEMBER_EMAIL':
        return !credentials.memberEmail;
      case 'RELEASE_PORTAL_TENANT_ADMIN_EMAIL':
        return !credentials.tenantAdminEmail;
      case 'RELEASE_ADMIN_EMAIL':
        return !credentials.adminEmail;
      case 'RELEASE_VALIDATION_PASSWORD':
        return !credentials.password;
      default:
        return true;
    }
  });

  return {
    status: missingVariables.length === 0 ? 'ENABLED' : 'SKIPPED',
    missingVariables
  };
}

export function formatAuthenticatedCoverageSummary(result) {
  if (result.status === 'ENABLED') {
    return `AUTHENTICATED_RELEASE_COVERAGE status=ENABLED checks=${result.executedChecks.join(',')}`;
  }

  return `AUTHENTICATED_RELEASE_COVERAGE status=SKIPPED missing=${result.missingVariables.join(',')}`;
}

export async function loginPortal(origins, email, path = '/api/auth/login') {
  const { password } = readReleaseCredentials();
  const response = await expectHttpStatus(
    `${origins.portal}${path}`,
    [200],
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        rememberMe: false
      })
    }
  );

  const payload = await response.json();
  const cookieJar = new CookieJar();
  cookieJar.absorb(response);

  if (!payload.sessionEstablished || !cookieJar.has('portal-session')) {
    throw new Error(`Portal session startup failed for ${email}.`);
  }

  return cookieJar;
}

export async function loginAdmin(origins) {
  const { adminEmail, password } = readReleaseCredentials();
  const response = await expectHttpStatus(
    `${origins.admin}/api/auth/login`,
    [200],
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: adminEmail,
        password
      })
    }
  );

  const payload = await response.json();

  if (!payload.token || !payload.user) {
    throw new Error('Admin session startup failed.');
  }

  return payload.token;
}

export async function validateReleaseWorkflows(origins) {
  const coverage = getAuthenticatedReleaseCoverage();

  if (coverage.status === 'SKIPPED') {
    console.log(formatAuthenticatedCoverageSummary({
      ...coverage,
      executedChecks: []
    }));
    return {
      ...coverage,
      executedChecks: []
    };
  }

  const { memberEmail, tenantAdminEmail } = readReleaseCredentials();
  const executedChecks = [];

  const memberSession = await loginPortal(origins, memberEmail);
  printCheck('member portal session startup', 'portal-session cookie issued');
  executedChecks.push('member_portal_session_startup');

  await expectHttpStatus(
    `${origins.portal}/dashboard`,
    [200],
    {
      headers: {
        Cookie: memberSession.header()
      }
    }
  );
  printCheck('member dashboard route', '/dashboard reachable with session cookie');
  executedChecks.push('member_dashboard_route');

  const tenantAdminSession = await loginPortal(origins, tenantAdminEmail);
  printCheck('tenant admin portal session startup', 'portal-session cookie issued');
  executedChecks.push('tenant_admin_portal_session_startup');

  await expectHttpStatus(
    `${origins.portal}/dashboard/billing-enrollment/administration`,
    [307],
    {
      headers: {
        Cookie: tenantAdminSession.header()
      }
    }
  );
  printCheck(
    'tenant admin boundary handoff',
    '/dashboard/billing-enrollment/administration redirects to admin-console login'
  );
  executedChecks.push('tenant_admin_boundary_handoff');

  const adminToken = await loginAdmin(origins);
  printCheck('admin-console session startup', 'bearer token returned');
  executedChecks.push('admin_console_session_startup');

  await expectHttpStatus(
    `${origins.admin}/api/auth/me`,
    [200],
    {
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    }
  );
  printCheck('admin-console auth me', '/api/auth/me reachable with bearer token');
  executedChecks.push('admin_console_auth_me');

  await expectHttpStatus(
    `${origins.api}/api-catalog`,
    [200],
    {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'x-tenant-id': 'platform'
      }
    }
  );
  printCheck('api catalog workflow', '/api-catalog reachable with admin bearer token');
  executedChecks.push('api_catalog_workflow');

  const result = {
    status: 'ENABLED',
    missingVariables: [],
    executedChecks
  };
  console.log(formatAuthenticatedCoverageSummary(result));
  return result;
}
