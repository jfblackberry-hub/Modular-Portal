import { NextResponse } from 'next/server';

import {
  getMe,
  getMemberAuthorizations,
  getMemberClaims,
  getMemberCoverage,
  getMemberProfile
} from '../../../../../lib/member-api';
import { getEstimatorBootstrap } from '../../../../../lib/care-cost-estimator/service';
import { getPortalSessionUser } from '../../../../../lib/portal-session';
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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workspace: string }> }
) {
  const sessionUser = await getPortalSessionUser();
  const workspace = (await params).workspace;

  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (workspace === 'benefits') {
    const coverage = await getMemberCoverage(sessionUser.id);
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
    const claims = await getMemberClaims(sessionUser.id);
    return NextResponse.json({
      items: claims?.items ?? []
    });
  }

  if (workspace === 'authorizations') {
    const authorizations = await getMemberAuthorizations(sessionUser.id);
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
    const [me, profile, coverage] = await Promise.all([
      getMe(sessionUser.id),
      getMemberProfile(sessionUser.id),
      getMemberCoverage(sessionUser.id)
    ]);
    const tenantBranding = await getTenantBranding(sessionUser.tenant, sessionUser.id, {
      experience: 'member'
    });
    const member = profile ?? me?.member;
    const plan = coverage?.items[0];
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
      issuerName: tenantBranding.displayName ?? sessionUser.tenant.name,
      logoUrl: tenantBranding.logoUrl,
      memberId,
      memberName,
      planName: plan?.planName ?? 'Coverage unavailable',
      rxBin: toRxSegment(groupNumber, 'bin'),
      rxGrp: toRxSegment(groupNumber, 'grp'),
      rxPcn: toRxSegment(groupNumber, 'pcn'),
      supportEmail: tenantBranding.supportEmail ?? 'support@portal.local',
      supportPhone: tenantBranding.supportPhone ?? '1-800-555-0199',
      terminationDate: plan?.terminationDate,
      updatedAt: member?.updatedAt
    });
  }

  return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
}
