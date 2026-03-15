export interface CanonicalEntity {
  id: string;
  sourceSystem: string;
  sourceRecordId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Member extends CanonicalEntity {
  firstName: string;
  lastName: string;
  dob: string;
  memberNumber: string;
}

export interface Coverage extends CanonicalEntity {
  memberId: string;
  planName: string;
  effectiveDate: string;
  terminationDate: string | null;
}

export interface Claim extends CanonicalEntity {
  memberId: string;
  coverageId: string;
  claimNumber: string;
  claimDate: string;
  status: string;
  totalAmount: number;
}

export interface Provider extends CanonicalEntity {
  providerNumber: string;
  name: string;
  specialty: string | null;
}

export interface Document extends CanonicalEntity {
  memberId: string;
  documentType: string;
  title: string;
  mimeType: string;
  url: string;
}
