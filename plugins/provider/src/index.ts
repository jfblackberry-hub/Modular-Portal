import type { PluginManifest, PluginNavigationItem } from '@payer-portal/plugin-sdk';

export const PROVIDER_OPERATIONS_CAPABILITY_ID = 'provider_operations';
export const PROVIDER_REPORTING_CAPABILITY_ID = 'provider_reporting';
export const PROVIDER_POC_SCOPE_EXCLUSIONS = [
  'provider_ai_copilot_experience',
  'provider_ai_copilot_capability',
  'provider_agentic_workflows',
  'provider_ai_required_core_behavior'
] as const;
export const PROVIDER_POC_FUTURE_EXTENSION_POINTS = [
  'optional provider ai assistance can be added later as a separate capability',
  'optional provider ai copilots can be added later without redesigning the tenant model',
  'optional automation and approval layers can be added later behind explicit provider capabilities'
] as const;

export const PROVIDER_OPERATION_WIDGETS: PluginNavigationItem[] = [
  {
    widgetId: 'provider-operations-dashboard',
    label: 'Dashboard',
    href: '/provider/dashboard',
    icon: 'home',
    requiredPermissions: ['tenant.view', 'provider.view']
  },
  {
    widgetId: 'provider-operations-scheduling',
    label: 'Scheduling',
    href: '/provider/scheduling',
    icon: 'calendar-days',
    requiredPermissions: ['tenant.view', 'provider.view'],
    futureCapabilityId: 'provider_scheduling'
  },
  {
    widgetId: 'provider-operations-authorizations',
    label: 'Authorizations',
    href: '/provider/authorizations',
    icon: 'clipboard-list',
    requiredPermissions: ['tenant.view', 'provider.authorizations.view'],
    futureCapabilityId: 'provider_authorizations'
  },
  {
    widgetId: 'provider-operations-utilization',
    label: 'Utilization',
    href: '/provider/utilization',
    icon: 'activity',
    requiredPermissions: ['tenant.view', 'provider.view'],
    futureCapabilityId: 'provider_utilization'
  },
  {
    widgetId: 'provider-operations-reporting',
    label: 'Reporting',
    href: '/provider/reporting',
    icon: 'bar-chart-3',
    requiredPermissions: ['tenant.view', 'provider.view'],
    futureCapabilityId: 'provider_reporting'
  },
  {
    widgetId: 'provider-operations-eligibility',
    label: 'Eligibility',
    href: '/provider/eligibility',
    icon: 'shield-check',
    requiredPermissions: ['tenant.view', 'provider.eligibility.view'],
    futureCapabilityId: 'provider_eligibility'
  },
  {
    widgetId: 'provider-operations-claims-payments',
    label: 'Claims & Billing',
    href: '/provider/claims',
    icon: 'file-text',
    requiredPermissions: ['tenant.view', 'provider.claims.view'],
    futureCapabilityId: 'provider_claims'
  },
  {
    widgetId: 'provider-operations-patients',
    label: 'Patients',
    href: '/provider/patients',
    icon: 'users',
    requiredPermissions: ['tenant.view', 'provider.patients.view'],
    futureCapabilityId: 'provider_patients'
  },
  {
    widgetId: 'provider-operations-documents',
    label: 'Documents',
    href: '/provider/documents',
    icon: 'folder-open',
    requiredPermissions: ['tenant.view', 'provider.documents.view'],
    futureCapabilityId: 'provider_resources'
  },
  {
    widgetId: 'provider-operations-messages',
    label: 'Messages',
    href: '/provider/messages',
    icon: 'mail',
    requiredPermissions: ['tenant.view', 'provider.messages.view'],
    futureCapabilityId: 'provider_messages'
  },
  {
    widgetId: 'provider-operations-admin',
    label: 'Admin',
    href: '/provider/admin',
    icon: 'settings',
    requiredPermissions: ['tenant.view', 'provider.admin.manage'],
    futureCapabilityId: 'provider_administration'
  }
];

export const manifest: PluginManifest = {
  id: 'provider',
  name: 'Provider Experience',
  version: '0.1.0',
  currentScopeExclusions: [...PROVIDER_POC_SCOPE_EXCLUSIONS],
  futureExtensionPoints: [...PROVIDER_POC_FUTURE_EXTENSION_POINTS],
  capabilities: [
    {
      id: PROVIDER_OPERATIONS_CAPABILITY_ID,
      label: 'Provider Operations',
      description:
        'Single deterministic Provider Operations capability for the initial Provider Experience POC. Widget-level persona gates control behavior and visibility while tenant-scoped capability enablement stays centralized. No AI Copilot capability, no AI Copilot experience, and no agentic workflow dependency is part of this POC path.',
      moduleKeys: ['provider_operations'],
      sectionTitle: 'Provider Operations',
      currentScopeExclusions: [...PROVIDER_POC_SCOPE_EXCLUSIONS],
      futureExtensionPoints: [...PROVIDER_POC_FUTURE_EXTENSION_POINTS],
      routes: [
        { path: '/provider/dashboard', label: 'Provider Dashboard' },
        { path: '/provider/scheduling', label: 'Scheduling' },
        { path: '/provider/eligibility', label: 'Eligibility & Benefits' },
        { path: '/provider/authorizations', label: 'Prior Authorizations' },
        { path: '/provider/claims', label: 'Claims' },
        { path: '/provider/utilization', label: 'Utilization' },
        { path: '/provider/payments', label: 'Payments' },
        { path: '/provider/patients', label: 'Patients' },
        { path: '/provider/documents', label: 'Provider Resources' },
        { path: '/provider/messages', label: 'Messages' },
        { path: '/provider/support', label: 'Support' },
        { path: '/provider/admin', label: 'Administration' }
      ],
      navigation: PROVIDER_OPERATION_WIDGETS.map((widget) => ({
        widgetId: widget.widgetId,
        label: widget.label,
        href: widget.href,
        icon: widget.icon,
        requiredPermissions: widget.requiredPermissions,
        futureCapabilityId: widget.futureCapabilityId
      }))
    },
    {
      id: PROVIDER_REPORTING_CAPABILITY_ID,
      label: 'Reporting',
      description:
        'Centralized clinic administration reporting workspace for historical operational and business performance across the ABA provider organization.',
      moduleKeys: ['provider_operations'],
      sectionTitle: 'Provider Operations',
      currentScopeExclusions: [...PROVIDER_POC_SCOPE_EXCLUSIONS],
      futureExtensionPoints: [
        'scheduled exports can be added later without changing the provider tenant model',
        'saved report views and provider analytics automations can be added later as optional reporting enhancements'
      ],
      routes: [{ path: '/provider/reporting', label: 'Reporting' }],
      navigation: []
    }
  ]
};
