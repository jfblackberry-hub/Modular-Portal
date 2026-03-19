import type { PortalSessionUser } from '../portal-session';

export type EstimateSortBy =
  | 'distance'
  | 'memberPayment'
  | 'allowedAmount'
  | 'rating'
  | 'providerGender'
  | 'networkTier'
  | 'specialty'
  | 'facilityType'
  | 'acceptsNewPatients'
  | 'telehealth'
  | 'language'
  | 'hospitalAffiliation';

export interface Member {
  id: string;
  memberId: string;
  planId: string;
  planName: string;
  product: string;
  pcpName: string;
  referralRequired: boolean;
  networkTierEligible: string[];
}

export interface MemberAccumulator {
  memberId: string;
  deductibleRemaining: number;
  deductibleTotal: number;
  oopRemaining: number;
  oopTotal: number;
}

export interface Plan {
  id: string;
  name: string;
  product: string;
  deductible: number;
  oopMax: number;
  description: string;
}

export interface PlanBenefitRule {
  id: string;
  planId: string;
  procedureCategory:
    | 'preventive'
    | 'pcp_visit'
    | 'specialist_visit'
    | 'imaging'
    | 'therapy'
    | 'lab'
    | 'screening'
    | 'outpatient_surgery';
  networkScope: 'in_network' | 'tier_2' | 'out_of_network';
  costShareType: 'full_coverage' | 'copay_only' | 'deductible_then_coinsurance';
  copay?: number;
  coinsurance?: number;
  notes: string;
}

export interface ProcedureCatalog {
  id: string;
  code: string;
  name: string;
  plainEnglish: string;
  category: PlanBenefitRule['procedureCategory'];
  specialty: string;
  siteOfService: 'office' | 'lab' | 'outpatient_hospital' | 'imaging_center' | 'ambulatory_surgery_center';
  priorAuthRequired: boolean;
  referralSuggested: boolean;
  ancillaryServicesPossible: boolean;
}

export interface ProcedureBundle {
  id: string;
  procedureId: string;
  component: 'professional' | 'facility' | 'technical';
  description: string;
  weight: number;
}

export interface Provider {
  id: string;
  name: string;
  providerType: 'physician' | 'facility';
  specialty: string;
  facilityType: string;
  networkTier: 'Tier 1' | 'Tier 2' | 'Out of Network';
  gender: 'Female' | 'Male' | 'Group';
  acceptsNewPatients: boolean;
  telehealthAvailable: boolean;
  languages: string[];
  boardCertified: boolean;
  eveningWeekendAvailability: boolean;
  accessibilityAccommodations: boolean;
  hospitalAffiliation: string;
  distanceMiles: number;
  location: string;
}

export interface ProviderDirectoryProfile {
  providerId: string;
  languages: string[];
  acceptsNewPatients: boolean;
  telehealthAvailable: boolean;
  eveningWeekendAvailability: boolean;
  accessibilityAccommodations: boolean;
}

export interface ProviderQualityProfile {
  providerId: string;
  rating: number;
  qualityLabel: string;
  patientExperienceScore: number;
}

export interface ProviderContractRate {
  providerId: string;
  procedureId: string;
  component: ProcedureBundle['component'];
  allowedAmount: number;
}

export interface CostEstimate {
  id: string;
  memberId: string;
  providerId: string;
  procedureId: string;
  generatedAt: string;
  allowedAmount: number;
  deductibleApplied: number;
  copayAmount: number;
  coinsuranceAmount: number;
  memberResponsibility: number;
  planResponsibility: number;
  updatedDeductibleRemaining: number;
  updatedOopRemaining: number;
  confidence: 'High' | 'Medium';
}

export interface EstimateAuditLog {
  id: string;
  estimateId: string;
  memberId: string;
  eventType: 'generated' | 'saved';
  createdAt: string;
  detail: string;
}

export interface EstimateFilters {
  inNetworkOnly: boolean;
  providerGender: 'All' | 'Female' | 'Male' | 'Group';
  specialty: string;
  facilityType: string;
  ratingThreshold: number;
  distanceRadius: number;
  acceptsNewPatients: boolean;
  telehealth: boolean;
  language: string;
  networkTier: 'All' | 'Tier 1' | 'Tier 2' | 'Out of Network';
  boardCertified: boolean;
  eveningWeekendAvailability: boolean;
  accessibilityAccommodations: boolean;
}

export interface EstimateSearchInput {
  memberId: string;
  procedureId?: string;
  searchTerm?: string;
  providerName?: string;
  specialty?: string;
  facilityName?: string;
  sortBy?: EstimateSortBy;
  filters?: Partial<EstimateFilters>;
}

export interface EstimateResult {
  estimate: CostEstimate;
  provider: Provider;
  directory: ProviderDirectoryProfile;
  quality: ProviderQualityProfile;
  procedure: ProcedureCatalog;
  priorAuthRequired: boolean;
  referralIndicator: boolean;
  planName: string;
  planPayment: number;
  ancillaryServicesNote: string;
  bestValue: boolean;
  calculationBreakdown: {
    deductibleRemainingBefore: number;
    deductibleApplied: number;
    copayAmount: number;
    coinsuranceAmount: number;
    memberResponsibility: number;
    planResponsibility: number;
    oopRemainingBefore: number;
    oopRemainingAfter: number;
    confidence: 'High' | 'Medium';
    notes: string[];
  };
}

export interface SavedEstimateRecord {
  id: string;
  estimateId: string;
  memberId: string;
  providerName: string;
  procedureName: string;
  memberResponsibility: number;
  allowedAmount: number;
  generatedAt: string;
}

export interface EstimatorBootstrapPayload {
  member: Member;
  accumulator: MemberAccumulator;
  plan: Plan;
  procedures: ProcedureCatalog[];
  providers: Provider[];
  specialties: string[];
  facilityTypes: string[];
  languages: string[];
  savedEstimates: SavedEstimateRecord[];
  disclaimer: string[];
}

function currency(value: number) {
  return Math.round(value * 100) / 100;
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

const plans: Plan[] = [
  {
    id: 'ppo-standard',
    name: 'PPO Standard',
    product: 'Commercial PPO',
    deductible: 2000,
    oopMax: 4500,
    description: 'Balanced PPO with office visit copays and deductible-based advanced services.'
  },
  {
    id: 'hdhp-hsa',
    name: 'HDHP / HSA',
    product: 'HDHP',
    deductible: 3200,
    oopMax: 6500,
    description: 'High deductible plan with lower premiums and post-deductible coinsurance.'
  },
  {
    id: 'gold-copay',
    name: 'Gold Copay Rich Plan',
    product: 'Gold PPO',
    deductible: 750,
    oopMax: 3000,
    description: 'Rich copay plan with lower member share for common office-based services.'
  }
];

const planRules: PlanBenefitRule[] = [
  { id: 'ppo-prev-in', planId: 'ppo-standard', procedureCategory: 'preventive', networkScope: 'in_network', costShareType: 'full_coverage', notes: 'Preventive services covered at 100% in-network.' },
  { id: 'ppo-pcp-in', planId: 'ppo-standard', procedureCategory: 'pcp_visit', networkScope: 'in_network', costShareType: 'copay_only', copay: 30, notes: 'In-network PCP office visit copay.' },
  { id: 'ppo-spec-in', planId: 'ppo-standard', procedureCategory: 'specialist_visit', networkScope: 'in_network', costShareType: 'copay_only', copay: 60, notes: 'In-network specialist office visit copay.' },
  { id: 'ppo-img-in', planId: 'ppo-standard', procedureCategory: 'imaging', networkScope: 'in_network', costShareType: 'deductible_then_coinsurance', coinsurance: 0.2, notes: 'Advanced imaging after deductible with 20% coinsurance.' },
  { id: 'ppo-therapy-in', planId: 'ppo-standard', procedureCategory: 'therapy', networkScope: 'in_network', costShareType: 'copay_only', copay: 45, notes: 'Therapy visit copay.' },
  { id: 'ppo-lab-in', planId: 'ppo-standard', procedureCategory: 'lab', networkScope: 'in_network', costShareType: 'deductible_then_coinsurance', coinsurance: 0.1, notes: 'Labs subject to deductible then 10% coinsurance.' },
  { id: 'ppo-screen-in', planId: 'ppo-standard', procedureCategory: 'screening', networkScope: 'in_network', costShareType: 'full_coverage', notes: 'Screening covered at 100% in-network.' },
  { id: 'ppo-surgery-in', planId: 'ppo-standard', procedureCategory: 'outpatient_surgery', networkScope: 'in_network', costShareType: 'deductible_then_coinsurance', coinsurance: 0.25, notes: 'Facility and professional components applied to deductible then 25% coinsurance.' },
  { id: 'ppo-out', planId: 'ppo-standard', procedureCategory: 'pcp_visit', networkScope: 'out_of_network', costShareType: 'deductible_then_coinsurance', coinsurance: 0.45, notes: 'Out-of-network office visit higher member share.' },
  { id: 'ppo-out-spec', planId: 'ppo-standard', procedureCategory: 'specialist_visit', networkScope: 'out_of_network', costShareType: 'deductible_then_coinsurance', coinsurance: 0.45, notes: 'Out-of-network specialist visit higher member share.' },
  { id: 'ppo-out-img', planId: 'ppo-standard', procedureCategory: 'imaging', networkScope: 'out_of_network', costShareType: 'deductible_then_coinsurance', coinsurance: 0.5, notes: 'Out-of-network imaging higher coinsurance.' },
  { id: 'ppo-out-surg', planId: 'ppo-standard', procedureCategory: 'outpatient_surgery', networkScope: 'out_of_network', costShareType: 'deductible_then_coinsurance', coinsurance: 0.55, notes: 'Out-of-network surgery higher coinsurance.' },

  { id: 'hdhp-prev-in', planId: 'hdhp-hsa', procedureCategory: 'preventive', networkScope: 'in_network', costShareType: 'full_coverage', notes: 'Preventive care covered before deductible.' },
  { id: 'hdhp-pcp-in', planId: 'hdhp-hsa', procedureCategory: 'pcp_visit', networkScope: 'in_network', costShareType: 'deductible_then_coinsurance', coinsurance: 0.15, notes: 'PCP visits subject to deductible then 15% coinsurance.' },
  { id: 'hdhp-spec-in', planId: 'hdhp-hsa', procedureCategory: 'specialist_visit', networkScope: 'in_network', costShareType: 'deductible_then_coinsurance', coinsurance: 0.2, notes: 'Specialist visits subject to deductible then 20% coinsurance.' },
  { id: 'hdhp-img-in', planId: 'hdhp-hsa', procedureCategory: 'imaging', networkScope: 'in_network', costShareType: 'deductible_then_coinsurance', coinsurance: 0.2, notes: 'Imaging subject to deductible then 20% coinsurance.' },
  { id: 'hdhp-therapy-in', planId: 'hdhp-hsa', procedureCategory: 'therapy', networkScope: 'in_network', costShareType: 'deductible_then_coinsurance', coinsurance: 0.15, notes: 'Therapy subject to deductible then 15% coinsurance.' },
  { id: 'hdhp-lab-in', planId: 'hdhp-hsa', procedureCategory: 'lab', networkScope: 'in_network', costShareType: 'deductible_then_coinsurance', coinsurance: 0.05, notes: 'Lab services subject to deductible then 5% coinsurance.' },
  { id: 'hdhp-screen-in', planId: 'hdhp-hsa', procedureCategory: 'screening', networkScope: 'in_network', costShareType: 'full_coverage', notes: 'Preventive screening covered.' },
  { id: 'hdhp-surgery-in', planId: 'hdhp-hsa', procedureCategory: 'outpatient_surgery', networkScope: 'in_network', costShareType: 'deductible_then_coinsurance', coinsurance: 0.2, notes: 'Surgery bundle subject to deductible then 20% coinsurance.' },
  { id: 'hdhp-out-img', planId: 'hdhp-hsa', procedureCategory: 'imaging', networkScope: 'out_of_network', costShareType: 'deductible_then_coinsurance', coinsurance: 0.5, notes: 'Out-of-network imaging high coinsurance.' },
  { id: 'hdhp-out-office', planId: 'hdhp-hsa', procedureCategory: 'pcp_visit', networkScope: 'out_of_network', costShareType: 'deductible_then_coinsurance', coinsurance: 0.5, notes: 'Out-of-network office visits high coinsurance.' },
  { id: 'hdhp-out-spec', planId: 'hdhp-hsa', procedureCategory: 'specialist_visit', networkScope: 'out_of_network', costShareType: 'deductible_then_coinsurance', coinsurance: 0.5, notes: 'Out-of-network specialist visits high coinsurance.' },
  { id: 'hdhp-out-surg', planId: 'hdhp-hsa', procedureCategory: 'outpatient_surgery', networkScope: 'out_of_network', costShareType: 'deductible_then_coinsurance', coinsurance: 0.6, notes: 'Out-of-network surgery bundle high coinsurance.' },

  { id: 'gold-prev-in', planId: 'gold-copay', procedureCategory: 'preventive', networkScope: 'in_network', costShareType: 'full_coverage', notes: 'Preventive service covered at 100%.' },
  { id: 'gold-pcp-in', planId: 'gold-copay', procedureCategory: 'pcp_visit', networkScope: 'in_network', costShareType: 'copay_only', copay: 15, notes: 'Low PCP copay.' },
  { id: 'gold-spec-in', planId: 'gold-copay', procedureCategory: 'specialist_visit', networkScope: 'in_network', costShareType: 'copay_only', copay: 35, notes: 'Lower specialist copay.' },
  { id: 'gold-img-in', planId: 'gold-copay', procedureCategory: 'imaging', networkScope: 'in_network', costShareType: 'deductible_then_coinsurance', coinsurance: 0.1, notes: 'Imaging subject to deductible then 10% coinsurance.' },
  { id: 'gold-therapy-in', planId: 'gold-copay', procedureCategory: 'therapy', networkScope: 'in_network', costShareType: 'copay_only', copay: 25, notes: 'Therapy copay.' },
  { id: 'gold-lab-in', planId: 'gold-copay', procedureCategory: 'lab', networkScope: 'in_network', costShareType: 'copay_only', copay: 10, notes: 'Lab copay.' },
  { id: 'gold-screen-in', planId: 'gold-copay', procedureCategory: 'screening', networkScope: 'in_network', costShareType: 'full_coverage', notes: 'Screening covered at 100%.' },
  { id: 'gold-surgery-in', planId: 'gold-copay', procedureCategory: 'outpatient_surgery', networkScope: 'in_network', costShareType: 'deductible_then_coinsurance', coinsurance: 0.15, notes: 'Surgery bundle subject to deductible then 15% coinsurance.' },
  { id: 'gold-out-office', planId: 'gold-copay', procedureCategory: 'pcp_visit', networkScope: 'out_of_network', costShareType: 'deductible_then_coinsurance', coinsurance: 0.45, notes: 'Out-of-network office visits high cost share.' },
  { id: 'gold-out-spec', planId: 'gold-copay', procedureCategory: 'specialist_visit', networkScope: 'out_of_network', costShareType: 'deductible_then_coinsurance', coinsurance: 0.45, notes: 'Out-of-network specialist visits high cost share.' },
  { id: 'gold-out-img', planId: 'gold-copay', procedureCategory: 'imaging', networkScope: 'out_of_network', costShareType: 'deductible_then_coinsurance', coinsurance: 0.5, notes: 'Out-of-network imaging high cost share.' },
  { id: 'gold-out-surg', planId: 'gold-copay', procedureCategory: 'outpatient_surgery', networkScope: 'out_of_network', costShareType: 'deductible_then_coinsurance', coinsurance: 0.55, notes: 'Out-of-network surgery high cost share.' }
];

const procedures: ProcedureCatalog[] = [
  { id: 'proc-pcp', code: '99213', name: 'PCP office visit', plainEnglish: 'Primary care office visit', category: 'pcp_visit', specialty: 'Primary Care', siteOfService: 'office', priorAuthRequired: false, referralSuggested: false, ancillaryServicesPossible: false },
  { id: 'proc-spec', code: '99244', name: 'Specialist office visit', plainEnglish: 'Specialist consultation', category: 'specialist_visit', specialty: 'Specialty Care', siteOfService: 'office', priorAuthRequired: false, referralSuggested: true, ancillaryServicesPossible: false },
  { id: 'proc-mri', code: '73721', name: 'MRI knee without contrast', plainEnglish: 'MRI of the knee', category: 'imaging', specialty: 'Imaging', siteOfService: 'imaging_center', priorAuthRequired: true, referralSuggested: false, ancillaryServicesPossible: true },
  { id: 'proc-colon', code: '45378', name: 'Colonoscopy', plainEnglish: 'Preventive colonoscopy screening', category: 'screening', specialty: 'Gastroenterology', siteOfService: 'outpatient_hospital', priorAuthRequired: false, referralSuggested: false, ancillaryServicesPossible: true },
  { id: 'proc-pt', code: '97110', name: 'Physical therapy session', plainEnglish: 'Physical therapy visit', category: 'therapy', specialty: 'Physical Therapy', siteOfService: 'office', priorAuthRequired: true, referralSuggested: true, ancillaryServicesPossible: false },
  { id: 'proc-cbc', code: '85025', name: 'CBC lab panel', plainEnglish: 'Complete blood count lab test', category: 'lab', specialty: 'Laboratory', siteOfService: 'lab', priorAuthRequired: false, referralSuggested: false, ancillaryServicesPossible: false },
  { id: 'proc-mammo', code: '77067', name: 'Mammogram', plainEnglish: 'Screening mammogram', category: 'preventive', specialty: 'Women’s Health', siteOfService: 'imaging_center', priorAuthRequired: false, referralSuggested: false, ancillaryServicesPossible: false },
  { id: 'proc-surgery', code: '29881', name: 'Outpatient knee arthroscopy', plainEnglish: 'Outpatient knee surgery', category: 'outpatient_surgery', specialty: 'Orthopedics', siteOfService: 'ambulatory_surgery_center', priorAuthRequired: true, referralSuggested: false, ancillaryServicesPossible: true }
];

const procedureBundles: ProcedureBundle[] = [
  { id: 'bundle-mri-tech', procedureId: 'proc-mri', component: 'technical', description: 'Imaging technical component', weight: 0.7 },
  { id: 'bundle-mri-prof', procedureId: 'proc-mri', component: 'professional', description: 'Imaging professional interpretation', weight: 0.3 },
  { id: 'bundle-colon-fac', procedureId: 'proc-colon', component: 'facility', description: 'Facility component', weight: 0.7 },
  { id: 'bundle-colon-prof', procedureId: 'proc-colon', component: 'professional', description: 'Physician component', weight: 0.3 },
  { id: 'bundle-surg-fac', procedureId: 'proc-surgery', component: 'facility', description: 'Facility component', weight: 0.68 },
  { id: 'bundle-surg-prof', procedureId: 'proc-surgery', component: 'professional', description: 'Professional surgeon component', weight: 0.32 }
];

const providers: Provider[] = [
  { id: 'prov-olivia-hart', name: 'Olivia Hart, MD', providerType: 'physician', specialty: 'Primary Care', facilityType: 'Clinic', networkTier: 'Tier 1', gender: 'Female', acceptsNewPatients: true, telehealthAvailable: true, languages: ['English', 'Spanish'], boardCertified: true, eveningWeekendAvailability: true, accessibilityAccommodations: true, hospitalAffiliation: 'Riverside Medical Center', distanceMiles: 2.1, location: 'Detroit, MI' },
  { id: 'prov-nathan-price', name: 'Nathan Price, MD', providerType: 'physician', specialty: 'Orthopedics', facilityType: 'Specialty Clinic', networkTier: 'Tier 1', gender: 'Male', acceptsNewPatients: true, telehealthAvailable: false, languages: ['English'], boardCertified: true, eveningWeekendAvailability: false, accessibilityAccommodations: true, hospitalAffiliation: 'Riverside Medical Center', distanceMiles: 5.7, location: 'Royal Oak, MI' },
  { id: 'prov-samara-chen', name: 'Samara Chen, DO', providerType: 'physician', specialty: 'Physical Therapy', facilityType: 'Therapy Center', networkTier: 'Tier 1', gender: 'Female', acceptsNewPatients: true, telehealthAvailable: true, languages: ['English', 'Mandarin'], boardCertified: true, eveningWeekendAvailability: true, accessibilityAccommodations: true, hospitalAffiliation: 'Lakeview Regional', distanceMiles: 4.4, location: 'Troy, MI' },
  { id: 'prov-lakeside-imaging', name: 'Lakeside Advanced Imaging', providerType: 'facility', specialty: 'Imaging', facilityType: 'Imaging Center', networkTier: 'Tier 1', gender: 'Group', acceptsNewPatients: true, telehealthAvailable: false, languages: ['English', 'Arabic'], boardCertified: false, eveningWeekendAvailability: true, accessibilityAccommodations: true, hospitalAffiliation: 'Lakeside Regional Hospital', distanceMiles: 6.8, location: 'Southfield, MI' },
  { id: 'prov-briarwood-gastro', name: 'Briarwood Gastro Center', providerType: 'facility', specialty: 'Gastroenterology', facilityType: 'Outpatient Hospital', networkTier: 'Tier 2', gender: 'Group', acceptsNewPatients: true, telehealthAvailable: false, languages: ['English'], boardCertified: false, eveningWeekendAvailability: false, accessibilityAccommodations: true, hospitalAffiliation: 'Briarwood Hospital', distanceMiles: 11.2, location: 'Ann Arbor, MI' },
  { id: 'prov-riverside-lab', name: 'Riverside Diagnostic Lab', providerType: 'facility', specialty: 'Laboratory', facilityType: 'Laboratory', networkTier: 'Tier 1', gender: 'Group', acceptsNewPatients: true, telehealthAvailable: false, languages: ['English', 'Spanish'], boardCertified: false, eveningWeekendAvailability: true, accessibilityAccommodations: true, hospitalAffiliation: 'Riverside Medical Center', distanceMiles: 3.5, location: 'Detroit, MI' },
  { id: 'prov-evergreen-womens', name: 'Evergreen Women’s Imaging', providerType: 'facility', specialty: 'Women’s Health', facilityType: 'Imaging Center', networkTier: 'Tier 1', gender: 'Group', acceptsNewPatients: true, telehealthAvailable: false, languages: ['English'], boardCertified: false, eveningWeekendAvailability: true, accessibilityAccommodations: true, hospitalAffiliation: 'Evergreen Hospital', distanceMiles: 7.3, location: 'Livonia, MI' },
  { id: 'prov-northpoint-asc', name: 'NorthPoint Surgery Center', providerType: 'facility', specialty: 'Orthopedics', facilityType: 'Ambulatory Surgery Center', networkTier: 'Tier 2', gender: 'Group', acceptsNewPatients: true, telehealthAvailable: false, languages: ['English'], boardCertified: false, eveningWeekendAvailability: false, accessibilityAccommodations: true, hospitalAffiliation: 'NorthPoint Hospital', distanceMiles: 14.6, location: 'Novi, MI' },
  { id: 'prov-outofnetwork-imaging', name: 'Metro Elite Imaging', providerType: 'facility', specialty: 'Imaging', facilityType: 'Imaging Center', networkTier: 'Out of Network', gender: 'Group', acceptsNewPatients: true, telehealthAvailable: false, languages: ['English', 'Hindi'], boardCertified: false, eveningWeekendAvailability: true, accessibilityAccommodations: false, hospitalAffiliation: 'Metro Elite Hospital', distanceMiles: 9.8, location: 'Detroit, MI' }
];

const providerDirectoryProfiles: ProviderDirectoryProfile[] = providers.map((provider) => ({
  providerId: provider.id,
  languages: provider.languages,
  acceptsNewPatients: provider.acceptsNewPatients,
  telehealthAvailable: provider.telehealthAvailable,
  eveningWeekendAvailability: provider.eveningWeekendAvailability,
  accessibilityAccommodations: provider.accessibilityAccommodations
}));

const qualityProfiles: ProviderQualityProfile[] = [
  { providerId: 'prov-olivia-hart', rating: 4.8, qualityLabel: 'High quality', patientExperienceScore: 94 },
  { providerId: 'prov-nathan-price', rating: 4.7, qualityLabel: 'High quality', patientExperienceScore: 91 },
  { providerId: 'prov-samara-chen', rating: 4.6, qualityLabel: 'High quality', patientExperienceScore: 90 },
  { providerId: 'prov-lakeside-imaging', rating: 4.4, qualityLabel: 'Quality verified', patientExperienceScore: 88 },
  { providerId: 'prov-briarwood-gastro', rating: 4.3, qualityLabel: 'Quality verified', patientExperienceScore: 84 },
  { providerId: 'prov-riverside-lab', rating: 4.5, qualityLabel: 'High value', patientExperienceScore: 92 },
  { providerId: 'prov-evergreen-womens', rating: 4.7, qualityLabel: 'High quality', patientExperienceScore: 93 },
  { providerId: 'prov-northpoint-asc', rating: 4.2, qualityLabel: 'Quality verified', patientExperienceScore: 82 },
  { providerId: 'prov-outofnetwork-imaging', rating: 4.0, qualityLabel: 'External quality data', patientExperienceScore: 79 }
];

const contractRates: ProviderContractRate[] = [
  { providerId: 'prov-olivia-hart', procedureId: 'proc-pcp', component: 'professional', allowedAmount: 145 },
  { providerId: 'prov-nathan-price', procedureId: 'proc-spec', component: 'professional', allowedAmount: 225 },
  { providerId: 'prov-samara-chen', procedureId: 'proc-pt', component: 'professional', allowedAmount: 165 },
  { providerId: 'prov-lakeside-imaging', procedureId: 'proc-mri', component: 'technical', allowedAmount: 940 },
  { providerId: 'prov-lakeside-imaging', procedureId: 'proc-mri', component: 'professional', allowedAmount: 280 },
  { providerId: 'prov-briarwood-gastro', procedureId: 'proc-colon', component: 'facility', allowedAmount: 1850 },
  { providerId: 'prov-briarwood-gastro', procedureId: 'proc-colon', component: 'professional', allowedAmount: 620 },
  { providerId: 'prov-riverside-lab', procedureId: 'proc-cbc', component: 'technical', allowedAmount: 58 },
  { providerId: 'prov-evergreen-womens', procedureId: 'proc-mammo', component: 'technical', allowedAmount: 210 },
  { providerId: 'prov-northpoint-asc', procedureId: 'proc-surgery', component: 'facility', allowedAmount: 6900 },
  { providerId: 'prov-northpoint-asc', procedureId: 'proc-surgery', component: 'professional', allowedAmount: 2300 },
  { providerId: 'prov-outofnetwork-imaging', procedureId: 'proc-mri', component: 'technical', allowedAmount: 1410 },
  { providerId: 'prov-outofnetwork-imaging', procedureId: 'proc-mri', component: 'professional', allowedAmount: 425 },
  { providerId: 'prov-outofnetwork-imaging', procedureId: 'proc-mammo', component: 'technical', allowedAmount: 320 }
];

const defaultFilters: EstimateFilters = {
  inNetworkOnly: false,
  providerGender: 'All',
  specialty: 'All',
  facilityType: 'All',
  ratingThreshold: 0,
  distanceRadius: 50,
  acceptsNewPatients: false,
  telehealth: false,
  language: 'All',
  networkTier: 'All',
  boardCertified: false,
  eveningWeekendAvailability: false,
  accessibilityAccommodations: false
};

const savedEstimatesStore = new Map<string, SavedEstimateRecord[]>();
const estimateAuditLogStore: EstimateAuditLog[] = [];

function selectPlanForUser(user?: PortalSessionUser | null) {
  if (!user) return plans[0];
  const seed = user.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return plans[seed % plans.length] ?? plans[0];
}

function buildMemberContext(user?: PortalSessionUser | null) {
  const plan = selectPlanForUser(user);
  const memberId = `MEM-${(user?.id ?? '1001').slice(0, 6).toUpperCase()}`;
  const member: Member = {
    id: user?.id ?? 'member-demo',
    memberId,
    planId: plan.id,
    planName: plan.name,
    product: plan.product,
    pcpName: 'Dr. Maya Thompson',
    referralRequired: plan.id !== 'ppo-standard',
    networkTierEligible: ['Tier 1', 'Tier 2']
  };
  const accumulatorSeed = plan.id === 'hdhp-hsa'
    ? { deductibleRemaining: 2350, deductibleTotal: plan.deductible, oopRemaining: 5125, oopTotal: plan.oopMax }
    : plan.id === 'gold-copay'
      ? { deductibleRemaining: 240, deductibleTotal: plan.deductible, oopRemaining: 1875, oopTotal: plan.oopMax }
      : { deductibleRemaining: 750, deductibleTotal: plan.deductible, oopRemaining: 3250, oopTotal: plan.oopMax };

  return {
    member,
    plan,
    accumulator: {
      memberId,
      ...accumulatorSeed
    } satisfies MemberAccumulator
  };
}

function getNetworkScope(tier: Provider['networkTier']): PlanBenefitRule['networkScope'] {
  if (tier === 'Out of Network') return 'out_of_network';
  if (tier === 'Tier 2') return 'tier_2';
  return 'in_network';
}

function getRule(planId: string, category: ProcedureCatalog['category'], tier: Provider['networkTier']) {
  const scope = getNetworkScope(tier);
  return (
    planRules.find((rule) => rule.planId === planId && rule.procedureCategory === category && rule.networkScope === scope) ??
    planRules.find((rule) => rule.planId === planId && rule.procedureCategory === category && rule.networkScope === 'in_network') ??
    planRules.find((rule) => rule.planId === planId && rule.procedureCategory === 'pcp_visit' && rule.networkScope === scope)
  );
}

function getProcedureAllowedAmount(providerId: string, procedureId: string) {
  const bundle = procedureBundles.filter((item) => item.procedureId === procedureId);
  if (!bundle.length) {
    const direct = contractRates.find((rate) => rate.providerId === providerId && rate.procedureId === procedureId);
    return {
      allowedAmount: direct?.allowedAmount ?? 0,
      confidence: 'High' as const
    };
  }

  const amount = bundle.reduce((sum, component) => {
    const rate = contractRates.find(
      (item) =>
        item.providerId === providerId &&
        item.procedureId === procedureId &&
        item.component === component.component
    );

    return sum + (rate?.allowedAmount ?? 0);
  }, 0);

  const hasAllComponents = bundle.every((component) =>
    contractRates.some(
      (item) =>
        item.providerId === providerId &&
        item.procedureId === procedureId &&
        item.component === component.component
    )
  );

  return {
    allowedAmount: amount,
    confidence: hasAllComponents ? ('High' as const) : ('Medium' as const)
  };
}

function applyRule({
  accumulator,
  allowedAmount,
  planId,
  procedure,
  provider
}: {
  accumulator: MemberAccumulator;
  allowedAmount: number;
  planId: string;
  procedure: ProcedureCatalog;
  provider: Provider;
}) {
  const rule = getRule(planId, procedure.category, provider.networkTier);
  const notes = [rule?.notes ?? 'Estimate uses the closest available benefit rule.'];
  const oopBefore = accumulator.oopRemaining;
  const deductibleBefore = accumulator.deductibleRemaining;

  if (!rule || allowedAmount <= 0) {
    const memberResponsibility = Math.min(currency(allowedAmount), oopBefore);
    return {
      deductibleApplied: 0,
      copayAmount: 0,
      coinsuranceAmount: 0,
      memberResponsibility,
      planResponsibility: currency(Math.max(allowedAmount - memberResponsibility, 0)),
      updatedDeductibleRemaining: deductibleBefore,
      updatedOopRemaining: currency(Math.max(oopBefore - memberResponsibility, 0)),
      confidence: 'Medium' as const,
      notes
    };
  }

  let deductibleApplied = 0;
  let copayAmount = 0;
  let coinsuranceAmount = 0;
  let memberResponsibility = 0;

  if (rule.costShareType === 'full_coverage') {
    memberResponsibility = 0;
    notes.push('Service covered at 100% under plan design.');
  } else if (rule.costShareType === 'copay_only') {
    copayAmount = Math.min(rule.copay ?? 0, allowedAmount);
    memberResponsibility = copayAmount;
    notes.push('Member estimate based on configured copay-only benefit.');
  } else {
    deductibleApplied = Math.min(deductibleBefore, allowedAmount);
    const remainingAfterDeductible = Math.max(allowedAmount - deductibleApplied, 0);
    coinsuranceAmount = currency(remainingAfterDeductible * (rule.coinsurance ?? 0));
    memberResponsibility = currency(deductibleApplied + coinsuranceAmount);
    notes.push('Estimate applies remaining deductible first, then coinsurance to the balance.');
  }

  if (provider.networkTier === 'Tier 2') {
    memberResponsibility = currency(memberResponsibility * 1.1);
    notes.push('Tier 2 network differential applied to estimate.');
  }

  const cappedResponsibility = Math.min(memberResponsibility, oopBefore);
  const planResponsibility = currency(Math.max(allowedAmount - cappedResponsibility, 0));

  return {
    deductibleApplied: currency(deductibleApplied),
    copayAmount: currency(copayAmount),
    coinsuranceAmount: currency(coinsuranceAmount),
    memberResponsibility: currency(cappedResponsibility),
    planResponsibility,
    updatedDeductibleRemaining: currency(Math.max(deductibleBefore - deductibleApplied, 0)),
    updatedOopRemaining: currency(Math.max(oopBefore - cappedResponsibility, 0)),
    confidence: (provider.networkTier === 'Out of Network' || procedure.ancillaryServicesPossible) ? ('Medium' as const) : ('High' as const),
    notes
  };
}

function buildEstimateResult({
  accumulator,
  member,
  plan,
  procedure,
  provider
}: {
  accumulator: MemberAccumulator;
  member: Member;
  plan: Plan;
  procedure: ProcedureCatalog;
  provider: Provider;
}) {
  const quality = qualityProfiles.find((item) => item.providerId === provider.id)!;
  const directory = providerDirectoryProfiles.find((item) => item.providerId === provider.id)!;
  const allowedInfo = getProcedureAllowedAmount(provider.id, procedure.id);
  const applied = applyRule({
    accumulator,
    allowedAmount: allowedInfo.allowedAmount,
    planId: plan.id,
    procedure,
    provider
  });
  const estimateId = `${member.memberId}-${procedure.id}-${provider.id}`;
  const estimate: CostEstimate = {
    id: estimateId,
    memberId: member.memberId,
    providerId: provider.id,
    procedureId: procedure.id,
    generatedAt: new Date().toISOString(),
    allowedAmount: currency(allowedInfo.allowedAmount),
    deductibleApplied: applied.deductibleApplied,
    copayAmount: applied.copayAmount,
    coinsuranceAmount: applied.coinsuranceAmount,
    memberResponsibility: applied.memberResponsibility,
    planResponsibility: applied.planResponsibility,
    updatedDeductibleRemaining: applied.updatedDeductibleRemaining,
    updatedOopRemaining: applied.updatedOopRemaining,
    confidence: applied.confidence
  };

  return {
    estimate,
    provider,
    directory,
    quality,
    procedure,
    priorAuthRequired: procedure.priorAuthRequired,
    referralIndicator: member.referralRequired || procedure.referralSuggested,
    planName: plan.name,
    planPayment: applied.planResponsibility,
    ancillaryServicesNote: procedure.ancillaryServicesPossible
      ? 'Estimate may exclude anesthesiology, pathology, or other ancillary services.'
      : 'No ancillary services expected in this estimate.',
    bestValue: false,
    calculationBreakdown: {
      deductibleRemainingBefore: accumulator.deductibleRemaining,
      deductibleApplied: applied.deductibleApplied,
      copayAmount: applied.copayAmount,
      coinsuranceAmount: applied.coinsuranceAmount,
      memberResponsibility: applied.memberResponsibility,
      planResponsibility: applied.planResponsibility,
      oopRemainingBefore: accumulator.oopRemaining,
      oopRemainingAfter: applied.updatedOopRemaining,
      confidence: estimate.confidence,
      notes: applied.notes
    }
  } satisfies EstimateResult;
}

function matchesSearchTerm(procedure: ProcedureCatalog, provider: Provider, input: EstimateSearchInput) {
  const term = input.searchTerm?.trim().toLowerCase() ?? '';
  if (!term) return true;

  const haystack = [
    procedure.name,
    procedure.plainEnglish,
    procedure.code,
    provider.name,
    provider.specialty,
    provider.facilityType,
    provider.hospitalAffiliation
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(term);
}

function applyFilters(results: EstimateResult[], filters: EstimateFilters) {
  return results.filter((result) => {
    if (filters.inNetworkOnly && result.provider.networkTier === 'Out of Network') return false;
    if (filters.providerGender !== 'All' && result.provider.gender !== filters.providerGender) return false;
    if (filters.specialty !== 'All' && result.provider.specialty !== filters.specialty) return false;
    if (filters.facilityType !== 'All' && result.provider.facilityType !== filters.facilityType) return false;
    if (filters.ratingThreshold > 0 && result.quality.rating < filters.ratingThreshold) return false;
    if (result.provider.distanceMiles > filters.distanceRadius) return false;
    if (filters.acceptsNewPatients && !result.provider.acceptsNewPatients) return false;
    if (filters.telehealth && !result.provider.telehealthAvailable) return false;
    if (filters.language !== 'All' && !result.provider.languages.includes(filters.language)) return false;
    if (filters.networkTier !== 'All' && result.provider.networkTier !== filters.networkTier) return false;
    if (filters.boardCertified && !result.provider.boardCertified) return false;
    if (filters.eveningWeekendAvailability && !result.provider.eveningWeekendAvailability) return false;
    if (filters.accessibilityAccommodations && !result.provider.accessibilityAccommodations) return false;
    return true;
  });
}

function sortResults(results: EstimateResult[], sortBy: EstimateSortBy) {
  const sorted = [...results];
  sorted.sort((left, right) => {
    switch (sortBy) {
      case 'memberPayment':
        return left.estimate.memberResponsibility - right.estimate.memberResponsibility;
      case 'allowedAmount':
        return left.estimate.allowedAmount - right.estimate.allowedAmount;
      case 'rating':
        return right.quality.rating - left.quality.rating;
      case 'providerGender':
        return left.provider.gender.localeCompare(right.provider.gender);
      case 'networkTier':
        return left.provider.networkTier.localeCompare(right.provider.networkTier);
      case 'specialty':
        return left.provider.specialty.localeCompare(right.provider.specialty);
      case 'facilityType':
        return left.provider.facilityType.localeCompare(right.provider.facilityType);
      case 'acceptsNewPatients':
        return Number(right.provider.acceptsNewPatients) - Number(left.provider.acceptsNewPatients);
      case 'telehealth':
        return Number(right.provider.telehealthAvailable) - Number(left.provider.telehealthAvailable);
      case 'language':
        return left.provider.languages[0]?.localeCompare(right.provider.languages[0] ?? '') ?? 0;
      case 'hospitalAffiliation':
        return left.provider.hospitalAffiliation.localeCompare(right.provider.hospitalAffiliation);
      case 'distance':
      default:
        return left.provider.distanceMiles - right.provider.distanceMiles;
    }
  });

  const lowCostThreshold = sorted
    .map((item) => item.estimate.memberResponsibility)
    .sort((a, b) => a - b)[Math.max(0, Math.floor(sorted.length / 4) - 1)] ?? Infinity;

  return sorted.map((result) => ({
    ...result,
    bestValue: result.quality.rating >= 4.5 && result.estimate.memberResponsibility <= lowCostThreshold
  }));
}

export function getEstimatorBootstrap(user?: PortalSessionUser | null): EstimatorBootstrapPayload {
  const { member, plan, accumulator } = buildMemberContext(user);
  return {
    member,
    accumulator,
    plan,
    procedures,
    providers,
    specialties: ['All', ...new Set(providers.map((provider) => provider.specialty))],
    facilityTypes: ['All', ...new Set(providers.map((provider) => provider.facilityType))],
    languages: ['All', ...new Set(providers.flatMap((provider) => provider.languages))],
    savedEstimates: savedEstimatesStore.get(member.memberId) ?? [],
    disclaimer: [
      'This is an estimate, not a guarantee of payment.',
      'Final member responsibility depends on actual services rendered and claim adjudication.',
      'Additional charges from ancillary providers may apply.',
      'Referral or prior authorization requirements may still apply.'
    ]
  };
}

export function runCareCostEstimate(input: EstimateSearchInput, user?: PortalSessionUser | null) {
  const { member, plan, accumulator } = buildMemberContext(user);
  const procedure = procedures.find((item) => item.id === input.procedureId) ??
    procedures.find((item) =>
      [item.name, item.plainEnglish, item.code].some((value) =>
        value.toLowerCase().includes((input.searchTerm ?? '').toLowerCase())
      )
    ) ??
    procedures[0];

  const filters: EstimateFilters = { ...defaultFilters, ...(input.filters ?? {}) };

  const candidateProviders = providers.filter((provider) => {
    if (input.providerName?.trim() && !provider.name.toLowerCase().includes(input.providerName.trim().toLowerCase())) {
      return false;
    }
    if (input.specialty?.trim() && input.specialty !== 'All' && provider.specialty !== input.specialty) {
      return false;
    }
    if (input.facilityName?.trim() && !provider.name.toLowerCase().includes(input.facilityName.trim().toLowerCase())) {
      return false;
    }
    return matchesSearchTerm(procedure, provider, input);
  });

  const baseResults = candidateProviders
    .map((provider) => buildEstimateResult({ accumulator, member, plan, procedure, provider }))
    .filter((result) => result.estimate.allowedAmount > 0);
  const filtered = applyFilters(baseResults, filters);
  const sorted = sortResults(filtered, input.sortBy ?? 'distance');

  estimateAuditLogStore.push({
    id: `audit-${Date.now()}`,
    estimateId: `${member.memberId}-${procedure.id}`,
    memberId: member.memberId,
    eventType: 'generated',
    createdAt: new Date().toISOString(),
    detail: `Generated ${sorted.length} estimates for ${procedure.name}.`
  });

  return {
    member,
    plan,
    accumulator,
    selectedProcedure: procedure,
    sortBy: input.sortBy ?? 'distance',
    filters,
    results: sorted,
    compareLimit: 4,
    disclaimers: getEstimatorBootstrap(user).disclaimer
  };
}

export function saveEstimateForMember(estimate: EstimateResult, user?: PortalSessionUser | null) {
  const { member } = buildMemberContext(user);
  const existing = savedEstimatesStore.get(member.memberId) ?? [];
  if (existing.some((item) => item.estimateId === estimate.estimate.id)) {
    return existing;
  }

  const next = [
    {
      id: `saved-${slug(estimate.estimate.id)}`,
      estimateId: estimate.estimate.id,
      memberId: member.memberId,
      providerName: estimate.provider.name,
      procedureName: estimate.procedure.name,
      memberResponsibility: estimate.estimate.memberResponsibility,
      allowedAmount: estimate.estimate.allowedAmount,
      generatedAt: estimate.estimate.generatedAt
    },
    ...existing
  ];
  savedEstimatesStore.set(member.memberId, next);
  estimateAuditLogStore.push({
    id: `audit-${Date.now()}`,
    estimateId: estimate.estimate.id,
    memberId: member.memberId,
    eventType: 'saved',
    createdAt: new Date().toISOString(),
    detail: `Saved estimate for ${estimate.provider.name} / ${estimate.procedure.name}.`
  });
  return next;
}

export function getEstimatorAdminConfig() {
  return {
    plans,
    planRules,
    procedures,
    procedureBundles,
    providers,
    qualityProfiles,
    contractRates,
    auditLogCount: estimateAuditLogStore.length
  };
}
