import type {
  Claim,
  Coverage,
  Document,
  Member
} from '@payer-portal/canonical-model';

export const apiRoutes = {
  me: '/api/v1/me',
  memberProfile: '/api/v1/member/profile',
  memberCoverage: '/api/v1/member/coverage',
  memberClaims: '/api/v1/member/claims',
  memberDocuments: '/api/v1/member/documents',
  memberMessages: '/api/v1/member/messages',
  memberAuthorizations: '/api/v1/member/authorizations'
} as const;

export interface ApiListResponse<T> {
  items: T[];
}

export interface MeResponse {
  member: Member;
  permissions: string[];
}

export interface MemberMessage {
  id: string;
  subject: string;
  from: string;
  status: string;
  preview: string;
  channel: string;
  createdAt: string;
}

export interface MemberAuthorization {
  id: string;
  service: string;
  status: string;
  submittedOn: string;
  type: string;
  detail?: string;
}

export type MemberProfileResponse = Member;
export type MemberCoverageResponse = ApiListResponse<Coverage>;
export type MemberClaimsResponse = ApiListResponse<Claim>;
export type MemberDocumentsResponse = ApiListResponse<Document>;
export type MemberMessagesResponse = ApiListResponse<MemberMessage>;
export type MemberAuthorizationsResponse = ApiListResponse<MemberAuthorization>;
