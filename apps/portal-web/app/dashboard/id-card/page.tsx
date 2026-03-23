import { MemberIdCardWorkspaceContent } from '../../../components/member/dashboard-workspaces/MemberIdCardWorkspaceContent';
import { getMe, getMemberCoverage, getMemberProfile } from '../../../lib/member-api';
import { getPortalSession } from '../../../lib/portal-session';
import { getTenantBranding } from '../../../lib/tenant-branding';

export default async function IdCardPage() {
  const session = await getPortalSession();
  const sessionUser = session?.user;
  const accessToken = session?.accessToken;
  const [me, profile, coverage] = await Promise.all([
    getMe(accessToken),
    getMemberProfile(accessToken),
    getMemberCoverage(accessToken)
  ]);

  const member = profile ?? me?.member;
  const plan = coverage?.items[0];
  const tenantBranding = sessionUser
    ? await getTenantBranding(sessionUser.tenant, sessionUser.id, {
      experience: 'member'
    })
    : undefined;
  const memberName = member
    ? `${member.firstName} ${member.lastName}`
    : [sessionUser?.firstName, sessionUser?.lastName].filter(Boolean).join(' ') || 'Unavailable';
  const memberId = member?.memberNumber ?? 'Unavailable';
  const groupNumber = toGroupNumber(
    plan?.sourceRecordId ?? sessionUser?.tenant?.id ?? plan?.id
  );
  const issuerName = tenantBranding?.displayName ?? sessionUser?.tenant.name ?? 'Member Health Plan';
  const supportPhone = tenantBranding?.supportPhone ?? '1-800-555-0199';
  const supportEmail = tenantBranding?.supportEmail ?? 'support@portal.local';
  const logoUrl = tenantBranding?.logoUrl;
  const planName = plan?.planName ?? 'Coverage unavailable';
  const rxBin = toRxSegment(groupNumber, 'bin');
  const rxPcn = toRxSegment(groupNumber, 'pcn');
  const rxGrp = toRxSegment(groupNumber, 'grp');

  return (
    <MemberIdCardWorkspaceContent
      effectiveDate={plan?.effectiveDate}
      groupNumber={groupNumber}
      issuerName={issuerName}
      logoUrl={logoUrl}
      memberId={memberId}
      memberName={memberName}
      planName={planName}
      rxBin={rxBin}
      rxGrp={rxGrp}
      rxPcn={rxPcn}
      supportEmail={supportEmail}
      supportPhone={supportPhone}
      terminationDate={plan?.terminationDate}
      updatedAt={member?.updatedAt}
    />
  );
}

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
