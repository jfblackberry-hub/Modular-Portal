import type {
  ApiCategory,
  ApiCatalogFiltersState,
  ApiCatalogSortField,
  AuthType,
  AwsRelevance,
  DataStandard,
  DeploymentModel,
  DocumentationStatus,
  ImplementationStatus,
  InterfaceFacing,
  ModuleAssociation,
  PrimaryUser,
  ReadinessLevel,
  StrategicPriority
} from './api-catalog.types';

export const API_CATEGORIES: ApiCategory[] = [
  'Pharmacy',
  'Claims',
  'Clinical',
  'Eligibility',
  'Benefits',
  'Authorizations',
  'Prior Authorization',
  'Payments',
  'Enrollment',
  'Billing',
  'Provider',
  'Member',
  'Employer',
  'Broker',
  'Admin',
  'Identity',
  'Observability',
  'Documents',
  'Interoperability',
  'Analytics',
  'Care Management',
  'CRM / Engagement'
];

export const IMPLEMENTATION_STATUSES: ImplementationStatus[] = [
  'Implemented',
  'Partial',
  'Planned',
  'Mocked',
  'Not Started'
];

export const READINESS_LEVELS: ReadinessLevel[] = [
  'Commercial Ready',
  'Operational',
  'Tenant Ready',
  'Architecture Ready',
  'Research'
];

export const STRATEGIC_PRIORITIES: StrategicPriority[] = [
  'Critical',
  'High',
  'Medium',
  'Low'
];

export const AUTH_TYPES: AuthType[] = [
  'OAuth 2.0',
  'OpenID Connect',
  'SMART on FHIR',
  'API Key',
  'Basic Auth',
  'Bearer Token',
  'mTLS',
  'SAML',
  'HL7 Credentials',
  'File Credential'
];

export const DATA_STANDARDS: DataStandard[] = [
  'FHIR R4',
  'FHIR Bulk',
  'HL7 v2',
  'X12 270/271',
  'X12 276/277',
  'X12 278',
  'X12 835',
  'X12 837',
  'NCPDP',
  'CSV',
  'JSON',
  'Webhook',
  'Proprietary'
];

export const DEPLOYMENT_MODELS: DeploymentModel[] = [
  'Vendor SaaS',
  'Cloud Hosted',
  'Hybrid',
  'Customer Hosted',
  'Platform Service'
];

export const AWS_RELEVANCE_OPTIONS: AwsRelevance[] = [
  'Blocker',
  'Important',
  'Helpful',
  'Future'
];

export const INTERFACE_FACING_OPTIONS: InterfaceFacing[] = [
  'External',
  'Internal',
  'Partner',
  'Platform'
];

export const MODULE_ASSOCIATIONS: ModuleAssociation[] = [
  'Member Portal',
  'Provider Portal',
  'Broker Portal',
  'Employer Portal',
  'Shop and Enroll',
  'Admin Console',
  'Notifications',
  'Billing and Enrollment',
  'Care Navigation',
  'Support Tooling'
];

export const PRIMARY_USERS: PrimaryUser[] = [
  'Platform Admin',
  'Tenant Admin',
  'Member',
  'Provider',
  'Employer',
  'Broker',
  'Operations',
  'Support',
  'Engineering'
];

export const DOCUMENTATION_STATUSES: DocumentationStatus[] = [
  'Unknown',
  'Internal Notes',
  'Vendor Docs Available',
  'Implementation Guide Drafted',
  'Operationalized'
];

export const API_CATALOG_SORT_OPTIONS: Array<{
  value: ApiCatalogSortField;
  label: string;
}> = [
  { value: 'vendorName', label: 'Vendor / Company' },
  { value: 'apiCategory', label: 'API Category' },
  { value: 'implementationStatus', label: 'Implementation Status' },
  { value: 'strategicPriority', label: 'Strategic Priority' },
  { value: 'lastReviewed', label: 'Last Reviewed' },
  { value: 'awsRelevance', label: 'AWS Relevance' }
];

export const DEFAULT_API_CATALOG_FILTERS: ApiCatalogFiltersState = {
  search: '',
  categories: [],
  implementationStatuses: [],
  strategicPriorities: [],
  vendor: 'All',
  authType: 'All',
  tenantConfigurable: 'All',
  awsRelevance: 'All',
  selectedTag: 'All',
  sortBy: 'strategicPriority',
  sortDirection: 'asc',
  viewMode: 'grid'
};
