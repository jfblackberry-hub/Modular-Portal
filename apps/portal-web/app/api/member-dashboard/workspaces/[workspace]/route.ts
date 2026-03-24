import { NextResponse } from 'next/server';

import { getEstimatorBootstrap } from '../../../../../lib/care-cost-estimator/service';
import {
  createDashboardSessionCacheKey,
  getCachedDashboardSessionValue
} from '../../../../../lib/dashboard-session-cache';
import {
  getMe,
  getMemberAuthorizations,
  getMemberClaims,
  getMemberCoverage,
  getMemberProfile
} from '../../../../../lib/member-api';
import { getPortalSession } from '../../../../../lib/portal-session';
import { getTenantBranding } from '../../../../../lib/tenant-branding';

function toGroupNumber(value?: string) {
  if (!value) {
    return 'Unavailable';
  }

  const normalized = value.replace(/[^a-z0-9]/gi, '').toUpperCase();
  if (!normalized) {
    return 'Unavailable';
  }

  if (normalized.length < 9) {
    return normalized;
  }

  return `${normalized.slice(0, 4)}-${normalized.slice(4, 8)}-${normalized.slice(8, 12)}`;
}

function toRxSegment(value: string, type: 'bin' | 'pcn' | 'grp') {
  const seed = value.replace(/[^a-z0-9]/gi, '').toUpperCase().padEnd(10, '0');
  if (type === 'bin') {
    const numeric = seed
      .slice(0, 6)
      .split('')
      .map((char) => (/\d/.test(char) ? char : String(char.charCodeAt(0) % 10)))
      .join('');
    return numeric;
  }

  if (type === 'pcn') {
    return seed.slice(0, 3);
  }

  return `RX${seed.slice(0, 5)}`;
}

const memberFindCareProviders = [
  {
    id: 'prov-1',
    name: 'North Harbor Clinic',
    specialty: 'Primary care',
    distance: '2.4 miles',
    status: 'In network'
  },
  {
    id: 'prov-2',
    name: 'Lakeview Behavioral Health',
    specialty: 'Behavioral health',
    distance: '5.1 miles',
    status: 'In network'
  },
  {
    id: 'prov-3',
    name: 'Summit Specialty Center',
    specialty: 'Cardiology',
    distance: '8.0 miles',
    status: 'Referral suggested'
  }
];

async function getCachedMemberCoverage(input: {
  accessToken: string;
  userId: string;
  tenantId: string;
}) {
  return getCachedDashboardSessionValue(
    createDashboardSessionCacheKey([
      'member-dashboard',
      input.tenantId,
      input.userId,
      'coverage'
    ]),
    async () => getMemberCoverage(input.accessToken)
  );
}

async function getCachedMemberClaims(input: {
  accessToken: string;
  userId: string;
  tenantId: string;
}) {
  return getCachedDashboardSessionValue(
    createDashboardSessionCacheKey([
      'member-dashboard',
      input.tenantId,
      input.userId,
      'claims'
    ]),
    async () => getMemberClaims(input.accessToken)
  );
}

async function getCachedMemberAuthorizations(input: {
  accessToken: string;
  userId: string;
  tenantId: string;
}) {
  return getCachedDashboardSessionValue(
    createDashboardSessionCacheKey([
      'member-dashboard',
      input.tenantId,
      input.userId,
      'authorizations'
    ]),
    async () => getMemberAuthorizations(input.accessToken)
  );
}

async function getCachedMemberIdCardDependencies(input: {
  accessToken: string;
  userId: string;
  tenantId: string;
  tenantName: string;
}) {
  return getCachedDashboardSessionValue(
    createDashboardSessionCacheKey([
      'member-dashboard',
      input.tenantId,
      input.userId,
      'id-card'
    ]),
    async () => {
      const [me, profile, coverage, tenantBranding] = await Promise.all([
        getMe(input.accessToken),
        getMemberProfile(input.accessToken),
        getCachedMemberCoverage(input),
        getTenantBranding(
          {
            id: input.tenantId,
            name: input.tenantName
          },
          input.userId,
          {
            experience: 'member'
          }
        )
      ]);

      return {
        coverage,
        me,
        profile,
        tenantBranding
      };
    }
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workspace: string }> }
) {
  const session = await getPortalSession();
  const sessionUser = session?.user;
  const accessToken = session?.accessToken;
  const workspace = (await params).workspace;

  if (!sessionUser || !accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (workspace === 'benefits') {
    const coverage = await getCachedMemberCoverage({
      accessToken,
      tenantId: sessionUser.tenant.id,
      userId: sessionUser.id
    });
    const plan = coverage?.items[0];

    return NextResponse.json({
      deductibleCurrent: 750,
      deductibleTotal: 2000,
      effectiveDate: plan?.effectiveDate,
      outOfPocketCurrent: 1250,
      outOfPocketTotal: 4500,
      planName: plan?.planName ?? `${sessionUser.tenant.name} Gold PPO`,
      terminationDate: plan?.terminationDate
    });
  }

  if (workspace === 'claims') {
    const claims = await getCachedMemberClaims({
      accessToken,
      tenantId: sessionUser.tenant.id,
      userId: sessionUser.id
    });
    return NextResponse.json({
      items: claims?.items ?? []
    });
  }

  if (workspace === 'authorizations') {
    const authorizations = await getCachedMemberAuthorizations({
      accessToken,
      tenantId: sessionUser.tenant.id,
      userId: sessionUser.id
    });
    return NextResponse.json({
      items: authorizations?.items ?? []
    });
  }

  if (workspace === 'find-care') {
    return NextResponse.json({
      providers: memberFindCareProviders
    });
  }

  if (workspace === 'care-cost-estimator') {
    return NextResponse.json({
      initialData: getEstimatorBootstrap(sessionUser)
    });
  }

  if (workspace === 'id-card') {
    const dependencies = await getCachedMemberIdCardDependencies({
      accessToken,
      tenantId: sessionUser.tenant.id,
      tenantName: sessionUser.tenant.name,
      userId: sessionUser.id
    });
    const member = dependencies.profile ?? dependencies.me?.member;
    const plan = dependencies.coverage?.items[0];
    const memberName = member
      ? `${member.firstName} ${member.lastName}`
      : [sessionUser.firstName, sessionUser.lastName].filter(Boolean).join(' ') || 'Unavailable';
    const memberId = member?.memberNumber ?? 'Unavailable';
    const groupNumber = toGroupNumber(
      plan?.sourceRecordId ?? sessionUser?.tenant?.id ?? plan?.id
    );

    return NextResponse.json({
      effectiveDate: plan?.effectiveDate,
      groupNumber,
      issuerName: dependencies.tenantBranding.displayName ?? sessionUser.tenant.name,
      logoUrl: dependencies.tenantBranding.logoUrl,
      memberId,
      memberName,
      planName: plan?.planName ?? 'Coverage unavailable',
      rxBin: toRxSegment(groupNumber, 'bin'),
      rxGrp: toRxSegment(groupNumber, 'grp'),
      rxPcn: toRxSegment(groupNumber, 'pcn'),
      supportEmail: dependencies.tenantBranding.supportEmail ?? 'support@portal.local',
      supportPhone: dependencies.tenantBranding.supportPhone ?? '1-800-555-0199',
      terminationDate: plan?.terminationDate,
      updatedAt: member?.updatedAt
    });
  }

  return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
}
