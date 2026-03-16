import 'server-only';

import {
  apiRoutes,
  type MemberAuthorizationsResponse,
  type MemberClaimsResponse,
  type MemberCoverageResponse,
  type MemberDocumentsResponse,
  type MemberMessagesResponse,
  type MemberProfileResponse,
  type MeResponse
} from '@payer-portal/api-contracts';

import { getPortalSessionAccessToken } from './portal-session';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3002';

async function buildRequestHeaders(accessToken?: string) {
  const sessionAccessToken = await getPortalSessionAccessToken();
  const resolvedAccessToken = sessionAccessToken ?? accessToken;

  if (!resolvedAccessToken) {
    return undefined;
  }

  return {
    Authorization: `Bearer ${resolvedAccessToken}`
  };
}

async function requestJson<T>(path: string, accessToken?: string): Promise<T | null> {
  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      headers: await buildRequestHeaders(accessToken),
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

export function getMe(accessToken?: string) {
  return requestJson<MeResponse>(apiRoutes.me, accessToken);
}

export function getMemberProfile(accessToken?: string) {
  return requestJson<MemberProfileResponse>(apiRoutes.memberProfile, accessToken);
}

export function getMemberCoverage(accessToken?: string) {
  return requestJson<MemberCoverageResponse>(apiRoutes.memberCoverage, accessToken);
}

export function getMemberClaims(accessToken?: string) {
  return requestJson<MemberClaimsResponse>(apiRoutes.memberClaims, accessToken);
}

export function getMemberDocuments(accessToken?: string) {
  return requestJson<MemberDocumentsResponse>(apiRoutes.memberDocuments, accessToken);
}

export function getMemberMessages(accessToken?: string) {
  return requestJson<MemberMessagesResponse>(apiRoutes.memberMessages, accessToken);
}

export function getMemberAuthorizations(accessToken?: string) {
  return requestJson<MemberAuthorizationsResponse>(
    apiRoutes.memberAuthorizations,
    accessToken
  );
}
