import { z } from 'zod';

const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
const isoDateTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

export const canonicalEntitySchema = z.object({
  id: z.string().min(1),
  sourceSystem: z.string().min(1),
  sourceRecordId: z.string().min(1),
  createdAt: z.string().regex(isoDateTimePattern),
  updatedAt: z.string().regex(isoDateTimePattern)
});

export const memberSchema = canonicalEntitySchema.extend({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dob: z.string().regex(dateOnlyPattern),
  memberNumber: z.string().min(1)
});

export const coverageSchema = canonicalEntitySchema.extend({
  memberId: z.string().min(1),
  planName: z.string().min(1),
  effectiveDate: z.string().regex(dateOnlyPattern),
  terminationDate: z.string().regex(dateOnlyPattern).nullable()
});

export const claimSchema = canonicalEntitySchema.extend({
  memberId: z.string().min(1),
  coverageId: z.string().min(1),
  claimNumber: z.string().min(1),
  claimDate: z.string().regex(dateOnlyPattern),
  status: z.string().min(1),
  totalAmount: z.number().nonnegative()
});

export const providerSchema = canonicalEntitySchema.extend({
  providerNumber: z.string().min(1),
  name: z.string().min(1),
  specialty: z.string().min(1).nullable()
});

export const documentSchema = canonicalEntitySchema.extend({
  memberId: z.string().min(1),
  documentType: z.string().min(1),
  title: z.string().min(1),
  mimeType: z.string().min(1),
  url: z.string().url()
});
