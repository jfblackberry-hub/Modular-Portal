import {
  claimSchema,
  coverageSchema,
  documentSchema,
  memberSchema,
  providerSchema
} from './schemas.js';
import type { Claim, Coverage, Document, Member, Provider } from './types.js';

const baseTimestamps = {
  createdAt: '2026-03-14T00:00:00.000Z',
  updatedAt: '2026-03-14T00:00:00.000Z'
};

export const memberFixture: Member = memberSchema.parse({
  id: 'member-001',
  sourceSystem: 'legacy-enrollment',
  sourceRecordId: 'mem-12345',
  firstName: 'Maya',
  lastName: 'Chen',
  dob: '1989-06-15',
  memberNumber: 'M00012345',
  ...baseTimestamps
});

export const coverageFixture: Coverage = coverageSchema.parse({
  id: 'coverage-001',
  sourceSystem: 'legacy-benefits',
  sourceRecordId: 'cov-12345',
  memberId: memberFixture.id,
  planName: 'Gold PPO',
  effectiveDate: '2026-01-01',
  terminationDate: null,
  ...baseTimestamps
});

export const claimFixture: Claim = claimSchema.parse({
  id: 'claim-001',
  sourceSystem: 'claims-core',
  sourceRecordId: 'clm-12345',
  memberId: memberFixture.id,
  coverageId: coverageFixture.id,
  claimNumber: 'C-100245',
  claimDate: '2026-02-20',
  status: 'adjudicated',
  totalAmount: 428.55,
  ...baseTimestamps
});

export const providerFixture: Provider = providerSchema.parse({
  id: 'provider-001',
  sourceSystem: 'provider-registry',
  sourceRecordId: 'prov-4552',
  providerNumber: 'P-778899',
  name: 'North Harbor Clinic',
  specialty: 'Primary Care',
  ...baseTimestamps
});

export const documentFixture: Document = documentSchema.parse({
  id: 'document-001',
  sourceSystem: 'document-store',
  sourceRecordId: 'doc-9912',
  memberId: memberFixture.id,
  documentType: 'explanation-of-benefits',
  title: 'Claim EOB - February 2026',
  mimeType: 'application/pdf',
  url: 'https://example.org/documents/eob-feb-2026.pdf',
  ...baseTimestamps
});

export const canonicalFixtures = {
  member: memberFixture,
  coverage: coverageFixture,
  claim: claimFixture,
  provider: providerFixture,
  document: documentFixture
};
