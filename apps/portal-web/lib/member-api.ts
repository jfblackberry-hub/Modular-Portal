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

import { buildPortalApiHeaders } from './api-request';
import { config } from './server-runtime';

async function buildRequestHeaders(accessToken?: string) {
  return buildPortalApiHeaders({}, { accessToken });
}

async function requestJson<T>(path: string, accessToken?: string): Promise<T | null> {
  try {
    const response = await fetch(`${config.apiBaseUrl}${path}`, {
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
