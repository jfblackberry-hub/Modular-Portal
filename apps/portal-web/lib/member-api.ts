import {
  apiRoutes,
  type MemberAuthorizationsResponse,
  type MemberClaimsResponse,
  type MemberCoverageResponse,
  type MemberDocumentsResponse,
  type MemberMessagesResponse,
  type MemberProfileResponse,
  type MeResponse} from '@payer-portal/api-contracts';

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3002';

async function requestJson<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export function getMe() {
  return requestJson<MeResponse>(apiRoutes.me);
}

export function getMemberProfile() {
  return requestJson<MemberProfileResponse>(apiRoutes.memberProfile);
}

export function getMemberCoverage() {
  return requestJson<MemberCoverageResponse>(apiRoutes.memberCoverage);
}

export function getMemberClaims() {
  return requestJson<MemberClaimsResponse>(apiRoutes.memberClaims);
}

export function getMemberDocuments() {
  return requestJson<MemberDocumentsResponse>(apiRoutes.memberDocuments);
}

export function getMemberMessages() {
  return requestJson<MemberMessagesResponse>(apiRoutes.memberMessages);
}

export function getMemberAuthorizations() {
  return requestJson<MemberAuthorizationsResponse>(apiRoutes.memberAuthorizations);
}
