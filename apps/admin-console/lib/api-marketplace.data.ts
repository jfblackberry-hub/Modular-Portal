import { API_CATALOG_SEED } from './api-catalog.seed';
import type { ApiCatalogEntry } from './api-catalog.types';
import type {
  ApiMarketplaceEntry,
  ApiMarketplaceFilters,
  MarketplaceApiType,
  MarketplaceAudience,
  MarketplaceCategory,
  MarketplaceLifecycleStatus
} from './api-marketplace.types';

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function mapCategory(entry: ApiCatalogEntry): MarketplaceCategory {
  if (entry.apiCategory === 'Claims') {
    return 'Claims';
  }

  if (entry.apiCategory === 'Eligibility' || entry.apiCategory === 'Benefits') {
    return 'Eligibility & Benefits';
  }

  if (entry.apiCategory === 'Provider') {
    return 'Provider';
  }

  if (entry.apiCategory === 'Member') {
    return 'Member';
  }

  if (entry.apiCategory === 'Enrollment' || entry.apiCategory === 'Billing') {
    return 'Enrollment & Billing';
  }

  if (entry.apiCategory === 'Pharmacy') {
    return 'Pharmacy';
  }

  if (entry.apiCategory === 'Clinical' || entry.apiCategory === 'Care Management') {
    return 'Clinical';
  }

  if (
    entry.apiCategory === 'Prior Authorization' ||
    entry.apiCategory === 'Authorizations'
  ) {
    return 'Prior Authorization';
  }

  if (entry.apiCategory === 'Interoperability') {
    return 'Interoperability / FHIR';
  }

  if (entry.apiCategory === 'Payments' || entry.apiCategory === 'Analytics') {
    return 'Financial / Payments';
  }

  return 'Admin / Platform';
}

function mapApiType(entry: ApiCatalogEntry): MarketplaceApiType {
  if (entry.integrationPatterns.includes('FHIR API')) {
    return 'FHIR';
  }

  if (entry.integrationPatterns.includes('Event Stream') || entry.integrationPatterns.includes('Webhook')) {
    return 'Event';
  }

  if (entry.integrationPatterns.includes('Batch File') || entry.integrationPatterns.includes('Flat File')) {
    return 'Batch';
  }

  if (entry.integrationPatterns.includes('EDI')) {
    return 'EDI';
  }

  if (entry.integrationDomain === 'Internal' || entry.integrationDomain === 'Platform') {
    return 'Internal';
  }

  if (entry.integrationDomain === 'External') {
    return 'External';
  }

  return 'REST';
}

function mapAudience(entry: ApiCatalogEntry): MarketplaceAudience[] {
  const audience = new Set<MarketplaceAudience>();

  if (entry.integrationDomain === 'Internal' || entry.integrationDomain === 'Platform') {
    audience.add('Internal');
  }

  if (entry.integrationDomain === 'Partner') {
    audience.add('Partner');
  }

  if (
    entry.primaryUsers.includes('Member') ||
    entry.primaryUsers.includes('Provider') ||
    entry.primaryUsers.includes('Employer') ||
    entry.primaryUsers.includes('Broker')
  ) {
    audience.add('Customer');
  }

  if (entry.primaryUsers.includes('Platform Admin') || entry.primaryUsers.includes('Tenant Admin')) {
    audience.add('Vendor');
  }

  if (audience.size === 0) {
    audience.add('Partner');
  }

  return Array.from(audience);
}

function mapLifecycleStatus(entry: ApiCatalogEntry): MarketplaceLifecycleStatus {
  if (entry.implementationStatus === 'Implemented') {
    return 'Available';
  }

  if (entry.implementationStatus === 'Partial' || entry.readinessLevel === 'Tenant Ready') {
    return 'Beta';
  }

  if (entry.awsRelevance === 'Blocker' && entry.implementationStatus === 'Not Started') {
    return 'Restricted';
  }

  return 'Planned';
}

function pickName(entry: ApiCatalogEntry) {
  const names: Record<string, string> = {
    'healthedge-healthrules-claims-and-benefits-apis': 'Benefit Accumulator API',
    'guidingcare-care-management-apis': 'Care Management Workflow API',
    'cognizant-trizetto-facets-claims-and-enrollment-apis': 'Enrollment API',
    'cognizant-trizetto-qnxt-payer-apis': 'Member Eligibility API',
    'epic-epic-fhir-apis': 'Clinical Data Exchange API',
    'oracle-health-cerner-millennium-apis': 'FHIR Patient Access API',
    'meditech-meditech-expanse-apis': 'Provider Clinical Data API',
    'availity-eligibility-and-payer-apis': 'Eligibility and Benefits API',
    'change-healthcare-claims-and-eligibility-apis': 'Claims Status API',
    'zelis-payments-and-repricing-apis': 'Provider Payments API',
    'waystar-revenue-cycle-apis': 'Claim Submission API',
    'surescripts-medication-history-and-eligibility-apis': 'Drug Formulary API',
    'express-scripts-pharmacy-benefit-apis': 'Pharmacy Benefit API',
    'cvs-caremark-pbm-integration-apis': 'Member Pharmacy Coverage API',
    'optumrx-pharmacy-and-formulary-apis': 'Drug Formulary and Coverage API',
    'salesforce-salesforce-health-cloud-apis': 'Member Engagement API',
    'mpulse-communications-and-engagement-apis': 'Member Outreach API',
    'twilio-messaging-and-communications-apis': 'Notifications and Messaging API',
    'amwell-telehealth-apis': 'Virtual Care API',
    'snowflake-data-share-and-analytics-apis': 'Healthcare Data Exchange API',
    'databricks-lakehouse-and-ai-apis': 'Clinical Analytics API',
    'aws-healthlake-fhir-and-search-apis': 'FHIR Repository API',
    'google-cloud-healthcare-api-cloud-healthcare-api': 'Healthcare Imaging and FHIR API',
    'redox-redox-interoperability-apis': 'Clinical Interoperability API',
    '1uphealth-fhir-platform-apis': 'Patient Access and FHIR API',
    'covermymeds-prior-authorization-and-medication-apis': 'Prior Authorization Submission API',
    'bamboo-health-care-intelligence-apis': 'Care Event Notification API',
    'okta-identity-and-access-apis': 'Identity and Access API',
    'datadog-observability-and-monitoring-apis': 'Integration Observability API',
    'mulesoft-anypoint-integration-apis': 'Partner Connectivity API',
    'docusign-document-and-consent-apis': 'Document Consent API',
    'edifecs-edifecs-interoperability-cloud': 'FHIR Interoperability Gateway API',
    'edifecs-edifecs-prior-authorization-suite': 'Prior Authorization Workflow API',
    'edifecs-edifecs-payer-and-provider-exchange': 'Payer Provider Exchange API'
  };

  return names[entry.id] ?? entry.apiName;
}

function versionFor(entry: ApiCatalogEntry) {
  if (entry.implementationStatus === 'Implemented') {
    return 'v2.1';
  }

  if (entry.implementationStatus === 'Partial') {
    return 'v1.8';
  }

  return 'v1.0';
}

function buildCapabilitySummary(entry: ApiCatalogEntry) {
  return [
    entry.apiSubcategory,
    `${entry.integrationPatterns[0] ?? 'REST'} delivery`,
    entry.dataStandards[0] ?? 'JSON',
    entry.tenantConfigurable ? 'Tenant configurable' : 'Platform managed'
  ];
}

function buildUseCases(entry: ApiCatalogEntry) {
  return [
    `Enable ${entry.apiCategory.toLowerCase()} workflows across ${entry.supportedModules.slice(0, 2).join(' and ').toLowerCase()}.`,
    `Support ${entry.primaryUsers.slice(0, 2).join(' and ').toLowerCase()} teams with a reusable integration pattern.`,
    `Accelerate tenant onboarding for ${entry.vendorName} environments.`
  ];
}

function buildEntry(entry: ApiCatalogEntry): ApiMarketplaceEntry {
  const category = mapCategory(entry);
  const lifecycleStatus = mapLifecycleStatus(entry);
  const name = pickName(entry);

  return {
    id: entry.id,
    slug: slugify(`${entry.vendorName}-${name}`),
    name,
    publisher: entry.vendorName,
    platformName: entry.platformName,
    shortDescription: entry.summary,
    fullDescription: entry.description,
    category,
    subcategory: entry.apiSubcategory,
    apiType: mapApiType(entry),
    domainTags: [entry.apiCategory, ...entry.tags].slice(0, 5),
    authType: entry.authTypes[0] ?? 'OAuth 2.0',
    audience: mapAudience(entry),
    lifecycleStatus,
    version: versionFor(entry),
    lastUpdated: entry.lastReviewed,
    sandboxAvailable: entry.environmentSupport.sandbox,
    documentationUrl: '',
    specUrl: '',
    environmentAvailability: [
      entry.environmentSupport.sandbox ? 'Sandbox' : null,
      entry.environmentSupport.test ? 'Test' : null,
      entry.environmentSupport.production ? 'Production' : null
    ].filter(Boolean) as string[],
    iconKey: entry.vendorSlug,
    featured:
      entry.strategicPriority === 'Critical' ||
      entry.awsRelevance === 'Blocker' ||
      entry.implementationStatus === 'Implemented',
    publisherSummary: `${entry.vendorName} · ${entry.platformName}`,
    readinessLabel: entry.readinessLevel,
    implementationStatus: entry.implementationStatus,
    strategicPriority: entry.strategicPriority,
    recommendedScore:
      (entry.strategicPriority === 'Critical' ? 30 : entry.strategicPriority === 'High' ? 20 : 10) +
      (entry.awsRelevance === 'Blocker' ? 20 : entry.awsRelevance === 'Important' ? 10 : 0) +
      (entry.implementationStatus === 'Implemented' ? 15 : entry.implementationStatus === 'Partial' ? 8 : 0),
    popularityScore:
      entry.supportedModules.length +
      entry.primaryUsers.length +
      (entry.environmentSupport.production ? 5 : 0) +
      (entry.environmentSupport.sandbox ? 3 : 0),
    integrationStyle: entry.integrationPatterns.slice(0, 2).join(' · '),
    standards: entry.dataStandards,
    supportedModules: entry.supportedModules,
    capabilitySummary: buildCapabilitySummary(entry),
    useCases: buildUseCases(entry),
    relatedApiSlugs: [],
    integrationNotes: entry.notes
  };
}

const baseEntries = API_CATALOG_SEED.map(buildEntry);

function attachRelated(entries: ApiMarketplaceEntry[]) {
  const byCategory = new Map<MarketplaceCategory, ApiMarketplaceEntry[]>();

  for (const entry of entries) {
    byCategory.set(entry.category, [...(byCategory.get(entry.category) ?? []), entry]);
  }

  return entries.map((entry) => ({
    ...entry,
    relatedApiSlugs: (byCategory.get(entry.category) ?? [])
      .filter((candidate) => candidate.slug !== entry.slug)
      .slice(0, 3)
      .map((candidate) => candidate.slug)
  }));
}

export const API_MARKETPLACE_CATALOG = attachRelated(baseEntries);

export const API_MARKETPLACE_CATEGORY_TABS: Array<'All APIs' | MarketplaceCategory> = [
  'All APIs',
  'Claims',
  'Eligibility & Benefits',
  'Provider',
  'Member',
  'Enrollment & Billing',
  'Pharmacy',
  'Clinical',
  'Prior Authorization',
  'Interoperability / FHIR',
  'Financial / Payments',
  'Admin / Platform'
];

export const DEFAULT_API_MARKETPLACE_FILTERS: ApiMarketplaceFilters = {
  search: '',
  category: 'All APIs',
  apiType: 'All',
  audience: 'All',
  lifecycleStatus: 'All',
  authType: 'All',
  sandbox: 'All',
  publisher: 'All',
  sort: 'Most Relevant'
};

export function getMarketplaceEntryBySlug(slug: string) {
  return API_MARKETPLACE_CATALOG.find((entry) => entry.slug === slug) ?? null;
}
