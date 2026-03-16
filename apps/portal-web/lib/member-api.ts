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

function buildRequestHeaders(userId?: string) {
  if (!userId) {
    return undefined;
  }

  return {
    'x-user-id': userId
  };
}

async function requestJson<T>(path: string, userId?: string): Promise<T | null> {
  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      headers: buildRequestHeaders(userId),
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

export function getMe(userId?: string) {
  return requestJson<MeResponse>(apiRoutes.me, userId);
}

export function getMemberProfile(userId?: string) {
  return requestJson<MemberProfileResponse>(apiRoutes.memberProfile, userId);
}

export function getMemberCoverage(userId?: string) {
  return requestJson<MemberCoverageResponse>(apiRoutes.memberCoverage, userId);
}

export function getMemberClaims(userId?: string) {
  return requestJson<MemberClaimsResponse>(apiRoutes.memberClaims, userId);
}

export function getMemberDocuments(userId?: string) {
  return requestJson<MemberDocumentsResponse>(apiRoutes.memberDocuments, userId);
}

export function getMemberMessages(userId?: string) {
  return requestJson<MemberMessagesResponse>(apiRoutes.memberMessages, userId);
}

export function getMemberAuthorizations(userId?: string) {
  return requestJson<MemberAuthorizationsResponse>(apiRoutes.memberAuthorizations, userId);
}
