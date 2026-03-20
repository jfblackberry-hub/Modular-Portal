export type MarketplaceCategory =
  | 'Claims'
  | 'Eligibility & Benefits'
  | 'Provider'
  | 'Member'
  | 'Enrollment & Billing'
  | 'Pharmacy'
  | 'Clinical'
  | 'Prior Authorization'
  | 'Interoperability / FHIR'
  | 'Financial / Payments'
  | 'Admin / Platform';

export type MarketplaceApiType =
  | 'REST'
  | 'FHIR'
  | 'Batch'
  | 'Event'
  | 'EDI'
  | 'Internal'
  | 'External';

export type MarketplaceAudience = 'Internal' | 'Partner' | 'Customer' | 'Vendor';

export type MarketplaceLifecycleStatus = 'Available' | 'Beta' | 'Planned' | 'Restricted';

export type MarketplaceSort =
  | 'Most Relevant'
  | 'Most Popular'
  | 'Recently Updated'
  | 'Alphabetical'
  | 'Recommended';

export type ApiMarketplaceEntry = {
  id: string;
  slug: string;
  name: string;
  publisher: string;
  platformName: string;
  shortDescription: string;
  fullDescription: string;
  category: MarketplaceCategory;
  subcategory: string;
  apiType: MarketplaceApiType;
  domainTags: string[];
  authType: string;
  audience: MarketplaceAudience[];
  lifecycleStatus: MarketplaceLifecycleStatus;
  version: string;
  lastUpdated: string;
  sandboxAvailable: boolean;
  documentationUrl: string;
  specUrl: string;
  environmentAvailability: string[];
  iconKey: string;
  featured: boolean;
  publisherSummary: string;
  readinessLabel: string;
  implementationStatus: string;
  strategicPriority: string;
  recommendedScore: number;
  popularityScore: number;
  integrationStyle: string;
  standards: string[];
  supportedModules: string[];
  capabilitySummary: string[];
  useCases: string[];
  relatedApiSlugs: string[];
  integrationNotes: string;
};

export type ApiMarketplaceFilters = {
  search: string;
  category: 'All APIs' | MarketplaceCategory;
  apiType: 'All' | MarketplaceApiType;
  audience: 'All' | MarketplaceAudience;
  lifecycleStatus: 'All' | MarketplaceLifecycleStatus;
  authType: 'All' | string;
  sandbox: 'All' | 'Yes' | 'No';
  publisher: 'All' | string;
  sort: MarketplaceSort;
};
