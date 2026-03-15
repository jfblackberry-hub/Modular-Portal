export interface ApplicantProfile {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  relationship: 'subscriber' | 'spouse' | 'child' | 'other';
}

export interface SubscriberProfile {
  id: string;
  firstName: string;
  lastName: string;
  memberId?: string;
}

export interface DependentProfile {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  relationship: 'spouse' | 'child' | 'other';
}

export interface HouseholdProfile {
  id: string;
  subscriber: SubscriberProfile;
  dependents: DependentProfile[];
  applicants: ApplicantProfile[];
}

export interface PlanBenefitSummary {
  premium: number;
  deductible: number;
  outOfPocketMax: number;
  pcpSummary: string;
  specialistSummary: string;
  pharmacySummary: string;
  networkFitSummary: string;
}

export interface PlanSelectionCandidate {
  planId: string;
  planName: string;
  badge?: 'lowest_premium' | 'most_popular' | 'best_value';
  benefits: PlanBenefitSummary;
}

export interface EffectiveDateSelection {
  requestedEffectiveDate: string;
  earliestAvailableDate: string;
}

export interface QualifyingLifeEventInput {
  eventType: string;
  eventDate: string;
  description?: string;
}

export interface EnrollmentProgressStep {
  key: string;
  label: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'pending';
  helpText: string;
}

export interface EnrollmentStatusTracker {
  enrollmentId: string;
  overallStatus: 'draft' | 'pending' | 'submitted' | 'completed';
  effectiveDate: string;
  pendingReason?: string;
  steps: EnrollmentProgressStep[];
}

export interface DocumentRequirementHook {
  id: string;
  title: string;
  requiredFor: string;
  status: 'missing' | 'received' | 'verified';
}
