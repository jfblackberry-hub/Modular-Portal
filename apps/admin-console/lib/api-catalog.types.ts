export type ApiCategory =
  | 'Pharmacy'
  | 'Claims'
  | 'Clinical'
  | 'Eligibility'
  | 'Benefits'
  | 'Authorizations'
  | 'Prior Authorization'
  | 'Payments'
  | 'Enrollment'
  | 'Billing'
  | 'Provider'
  | 'Member'
  | 'Employer'
  | 'Broker'
  | 'Admin'
  | 'Identity'
  | 'Observability'
  | 'Documents'
  | 'Interoperability'
  | 'Analytics'
  | 'Care Management'
  | 'CRM / Engagement';

export type ImplementationStatus =
  | 'Not Started'
  | 'Planned'
  | 'Partial'
  | 'Implemented'
  | 'Mocked';

export type ReadinessLevel =
  | 'Research'
  | 'Architecture Ready'
  | 'Tenant Ready'
  | 'Operational'
  | 'Commercial Ready';

export type StrategicPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export type AuthType =
  | 'OAuth 2.0'
  | 'OpenID Connect'
  | 'SMART on FHIR'
  | 'API Key'
  | 'Basic Auth'
  | 'Bearer Token'
  | 'mTLS'
  | 'SAML'
  | 'HL7 Credentials'
  | 'File Credential';

export type DataStandard =
  | 'FHIR R4'
  | 'FHIR Bulk'
  | 'HL7 v2'
  | 'X12 270/271'
  | 'X12 276/277'
  | 'X12 278'
  | 'X12 835'
  | 'X12 837'
  | 'NCPDP'
  | 'CSV'
  | 'JSON'
  | 'Webhook'
  | 'Proprietary';

export type DeploymentModel =
  | 'Vendor SaaS'
  | 'Cloud Hosted'
  | 'Hybrid'
  | 'Customer Hosted'
  | 'Platform Service';

export type AwsRelevance = 'Blocker' | 'Important' | 'Helpful' | 'Future';

export type InterfaceFacing = 'External' | 'Internal' | 'Partner' | 'Platform';

export type IntegrationPattern =
  | 'REST'
  | 'FHIR API'
  | 'Bulk Export'
  | 'Webhook'
  | 'Batch File'
  | 'EDI'
  | 'Event Stream'
  | 'Database Share'
  | 'Flat File';

export type ModuleAssociation =
  | 'Member Portal'
  | 'Provider Portal'
  | 'Broker Portal'
  | 'Employer Portal'
  | 'Shop and Enroll'
  | 'Admin Console'
  | 'Notifications'
  | 'Billing and Enrollment'
  | 'Care Navigation'
  | 'Support Tooling';

export type PrimaryUser =
  | 'Platform Admin'
  | 'Tenant Admin'
  | 'Member'
  | 'Provider'
  | 'Employer'
  | 'Broker'
  | 'Operations'
  | 'Support'
  | 'Engineering';

export type DocumentationStatus =
  | 'Unknown'
  | 'Internal Notes'
  | 'Vendor Docs Available'
  | 'Implementation Guide Drafted'
  | 'Operationalized';

export type EnvironmentSupport = {
  sandbox: boolean;
  test: boolean;
  production: boolean;
};

export type ObservabilitySupport = {
  healthChecks: boolean;
  logs: boolean;
  metrics: boolean;
  alerts: boolean;
};

export type ApiCatalogEntry = {
  id: string;
  vendorName: string;
  vendorSlug: string;
  platformName: string;
  platformSlug: string;
  apiName: string;
  apiCategory: ApiCategory;
  apiSubcategory: string;
  integrationDomain: InterfaceFacing;
  strategicPriority: StrategicPriority;
  summary: string;
  description: string;
  supportedModules: ModuleAssociation[];
  primaryUsers: PrimaryUser[];
  integrationPatterns: IntegrationPattern[];
  authTypes: AuthType[];
  dataStandards: DataStandard[];
  deploymentModel: DeploymentModel;
  implementationStatus: ImplementationStatus;
  readinessLevel: ReadinessLevel;
  tenantConfigurable: boolean;
  tenantEnablementPotential: 'Single Tenant' | 'Multi Tenant Template' | 'Platform Managed';
  environmentSupport: EnvironmentSupport;
  awsRelevance: AwsRelevance;
  observabilitySupport: ObservabilitySupport;
  documentationStatus: DocumentationStatus;
  lastReviewed: string;
  relatedModules: ModuleAssociation[];
  tags: string[];
  notes: string;
  futureAwsMapping: string[];
  canonicalModelMapping: string[];
};

export type ApiCatalogSortField =
  | 'vendorName'
  | 'apiCategory'
  | 'implementationStatus'
  | 'strategicPriority'
  | 'lastReviewed'
  | 'awsRelevance';

export type ApiCatalogViewMode = 'table' | 'grid';

export type ApiCatalogFiltersState = {
  search: string;
  categories: ApiCategory[];
  implementationStatuses: ImplementationStatus[];
  strategicPriorities: StrategicPriority[];
  vendor: string;
  authType: AuthType | 'All';
  tenantConfigurable: 'All' | 'Yes' | 'No';
  awsRelevance: AwsRelevance | 'All';
  selectedTag: string;
  sortBy: ApiCatalogSortField;
  sortDirection: 'asc' | 'desc';
  viewMode: ApiCatalogViewMode;
};
