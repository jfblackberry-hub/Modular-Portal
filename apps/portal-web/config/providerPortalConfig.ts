export type ProviderPortalVariant = 'medical' | 'pharmacy' | 'dental' | 'vision';

export type ProviderPortalRouteKey =
  | 'dashboard'
  | 'eligibility'
  | 'authorizations'
  | 'claims'
  | 'payments'
  | 'patients'
  | 'documents'
  | 'messages'
  | 'support'
  | 'admin';

export type ProviderPortalNavIcon =
  | 'home'
  | 'shield-check'
  | 'clipboard-list'
  | 'file-text'
  | 'wallet'
  | 'users'
  | 'folder-open'
  | 'mail'
  | 'life-buoy'
  | 'settings';

export interface ProviderPortalNavItem {
  key: ProviderPortalRouteKey;
  href: string;
  label: string;
  icon: ProviderPortalNavIcon;
}

export interface ProviderDashboardWidget {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export interface ProviderDashboardSection {
  id: string;
  title: string;
  description: string;
  widgets: ProviderDashboardWidget[];
}

export interface ProviderQuickAction {
  id: string;
  href: string;
  label: string;
  description: string;
  icon: string;
}

export interface ProviderDocumentCategory {
  id: string;
  label: string;
  description: string;
}

export type ProviderResourceLinkType = 'internal' | 'external' | 'download';

export interface ProviderResourceItem {
  id: string;
  category:
    | 'Forms'
    | 'Manuals'
    | 'Policies'
    | 'Training'
    | 'Claims Resources'
    | 'Authorization Resources'
    | 'Payment Resources'
    | 'Practice Administration';
  title: string;
  type: string;
  description: string;
  tags: string[];
  lineOfBusinessApplicability: string[];
  lastUpdated: string;
  linkTarget: string;
  linkType: ProviderResourceLinkType;
}

export interface ProviderSupportLink {
  id: string;
  href: string;
  label: string;
  description: string;
}

export interface ProviderAuthorizationsModuleConfig {
  labels: {
    title: string;
    description: string;
    checkRequirement: string;
    submitRequest: string;
    trackRequests: string;
    referrals: string;
    attachments: string;
    requestTerm: string;
    referralTerm: string;
  };
}

export type ProviderMessageCategory =
  | 'Operational Updates'
  | 'Authorization Updates'
  | 'Claims / Payment Notices'
  | 'Policy Changes'
  | 'Training / Education'
  | 'Maintenance Notices';

export interface ProviderMessageItem {
  id: string;
  subject: string;
  preview: string;
  body: string;
  category: ProviderMessageCategory;
  date: string;
  unread: boolean;
  actionRequired: boolean;
  priority: 'Low' | 'Medium' | 'High';
}

export interface ProviderAnnouncementItem {
  id: string;
  title: string;
  message: string;
  type: 'banner' | 'info' | 'maintenance';
  date: string;
}

export interface ProviderEligibilityResultItem {
  member: string;
  memberId: string;
  plan: string;
  status: 'Active' | 'Inactive' | 'Pending Review';
}

export interface ProviderClaimRow {
  claimNumber: string;
  patient: string;
  memberId: string;
  serviceDate: string;
  billedAmount: string;
  allowedAmount: string;
  paidAmount: string;
  status: 'Draft' | 'Submitted' | 'In Review' | 'More Info Needed' | 'Approved' | 'Denied' | 'Paid';
  billingProvider: string;
  renderingProvider: string;
}

export interface ProviderPaymentRow {
  remitId: string;
  paymentDate: string;
  paymentAmount: string;
  method: 'EFT' | 'Check';
  eftEra: string;
  status: 'Posted' | 'In Transit' | 'Pending';
}

export interface ProviderTrackedAuthorizationItem {
  status: string;
  submittedDate: string;
  referenceNumber: string;
  patient: string;
  service: string;
  decision: string;
  nextAction: string;
}

export interface ProviderReferralItem {
  reference: string;
  patient: string;
  specialty: string;
  status: string;
  submittedDate: string;
}

export interface ProviderDashboardMetricItem {
  label: string;
  value: string;
  trend: string;
  trendTone: 'positive' | 'negative' | 'neutral';
}

export interface ProviderDashboardQueueItem {
  authId?: string;
  claimId?: string;
  patientName: string;
  date: string;
  status: string;
  nextAction: string;
}

export interface ProviderDashboardAlertItem {
  id: string;
  type: 'warning' | 'info' | 'success';
  message: string;
  status: string;
  date: string;
}

export interface ProviderDashboardNoticeItem {
  id: string;
  title: string;
  message: string;
  date: string;
}

export interface ProviderDashboardResourceItem {
  label: string;
  href: string;
  description: string;
}

export interface ProviderPortalDemoData {
  eligibilityResults?: ProviderEligibilityResultItem[];
  trackedAuthorizations?: ProviderTrackedAuthorizationItem[];
  referrals?: ProviderReferralItem[];
  claimsRows?: ProviderClaimRow[];
  paymentRows?: ProviderPaymentRow[];
  dashboardMetrics?: ProviderDashboardMetricItem[];
  dashboardAuthorizationQueue?: ProviderDashboardQueueItem[];
  dashboardClaimsQueue?: ProviderDashboardQueueItem[];
  dashboardAlerts?: ProviderDashboardAlertItem[];
  dashboardNotices?: ProviderDashboardNoticeItem[];
  dashboardResources?: ProviderDashboardResourceItem[];
}

export interface ProviderMessagesModuleConfig {
  categories: ProviderMessageCategory[];
  inbox: ProviderMessageItem[];
  announcements: ProviderAnnouncementItem[];
}

export type ProviderSupportCategory =
  | 'Claims Support'
  | 'Eligibility Support'
  | 'Authorization Support'
  | 'Portal Technical Support'
  | 'Provider Data / Demographics'
  | 'Payments / EFT / ERA';

export interface ProviderSupportCard {
  id: string;
  title: string;
  description: string;
  href: string;
}

export interface ProviderTrainingBlock {
  id: string;
  title: string;
  description: string;
  href: string;
}

export interface ProviderSupportQuickLink {
  id: string;
  label: string;
  value: string;
  href: string;
}

export interface ProviderSupportModuleConfig {
  title: string;
  description: string;
  categories: ProviderSupportCategory[];
  cards: ProviderSupportCard[];
  trainingBlocks: ProviderTrainingBlock[];
  quickLinks: ProviderSupportQuickLink[];
}

export interface ProviderAdminUserRole {
  role: 'admin users' | 'standard staff' | 'billing users' | 'authorization users' | 'read-only users';
  count: number;
  description: string;
}

export interface ProviderAdminPracticeInfo {
  practiceName: string;
  npi: string;
  tin: string;
  address: string;
  phone: string;
  primaryContact: string;
  specialty: string;
}

export interface ProviderAdminLocationItem {
  id: string;
  name: string;
  officeHours: string;
  address: string;
  status: 'Active' | 'Inactive';
}

export interface ProviderAdminRenderingProvider {
  id: string;
  name: string;
  specialty: string;
  status: 'Active' | 'Inactive';
}

export interface ProviderAdminNotificationPreference {
  id: string;
  channel: string;
  topic: string;
  enabled: boolean;
}

export interface ProviderAdminLinkedIdentifier {
  id: string;
  type: 'NPI' | 'TIN';
  value: string;
  status: string;
}

export interface ProviderAdminModuleConfig {
  title: string;
  description: string;
  enabledSections: Array<
    | 'User Access'
    | 'Practice Information'
    | 'Locations'
    | 'Rendering Providers'
    | 'Notification Preferences'
    | 'Linked Tax IDs / NPIs'
  >;
  userAccessRoles: ProviderAdminUserRole[];
  practiceInformation: ProviderAdminPracticeInfo;
  locations: ProviderAdminLocationItem[];
  renderingProviders: ProviderAdminRenderingProvider[];
  notificationPreferences: ProviderAdminNotificationPreference[];
  linkedIdentifiers: ProviderAdminLinkedIdentifier[];
}

export interface ProviderNotificationsAreaItem {
  id: string;
  title: string;
  message: string;
  tone: 'info' | 'warning' | 'success';
}

export interface ProviderModuleContent {
  title: string;
  description: string;
  highlights: string[];
  quickActionIds?: string[];
}

export interface ProviderPortalConfig {
  portalType: ProviderPortalVariant;
  displayName: string;
  navItems: ProviderPortalNavItem[];
  dashboardSections: ProviderDashboardSection[];
  quickActions: ProviderQuickAction[];
  documentCategories: ProviderDocumentCategory[];
  providerResources: ProviderResourceItem[];
  supportLinks: ProviderSupportLink[];
  authorizationsModule: ProviderAuthorizationsModuleConfig;
  messagesModule: ProviderMessagesModuleConfig;
  supportModule: ProviderSupportModuleConfig;
  adminModule: ProviderAdminModuleConfig;
  featureFlags: Record<string, boolean>;
  modules: Array<{ key: string; label: string; href: string }>;
  routeContent: Record<ProviderPortalRouteKey, ProviderModuleContent>;
  shellDescription: string;
  notificationsTitle: string;
  providerRoleLabel: string;
  providerContext: {
    practiceName: string;
    providerName: string;
    npi: string;
    tin: string;
    locations: Array<{ id: string; label: string }>;
    selectedLocationId: string;
  };
  notifications: ProviderNotificationsAreaItem[];
  demoData?: ProviderPortalDemoData;
}

const medicalConfig: ProviderPortalConfig = {
  portalType: 'medical',
  displayName: 'Medical Provider Portal',
  navItems: [
    { key: 'dashboard', href: '/provider/dashboard', label: 'Dashboard', icon: 'home' },
    {
      key: 'eligibility',
      href: '/provider/eligibility',
      label: 'Eligibility & Benefits',
      icon: 'shield-check'
    },
    {
      key: 'authorizations',
      href: '/provider/authorizations',
      label: 'Prior Auths / Referrals',
      icon: 'clipboard-list'
    },
    {
      key: 'claims',
      href: '/provider/claims',
      label: 'Claims & Payments',
      icon: 'file-text'
    },
    { key: 'payments', href: '/provider/payments', label: 'Payments', icon: 'wallet' },
    { key: 'patients', href: '/provider/patients', label: 'Patients', icon: 'users' },
    {
      key: 'documents',
      href: '/provider/documents',
      label: 'Provider Resources',
      icon: 'folder-open'
    },
    { key: 'messages', href: '/provider/messages', label: 'Messages', icon: 'mail' },
    { key: 'support', href: '/provider/support', label: 'Support', icon: 'life-buoy' },
    { key: 'admin', href: '/provider/admin', label: 'Admin', icon: 'settings' }
  ],
  dashboardSections: [
    {
      id: 'operations-snapshot',
      title: 'Operational Snapshot',
      description: 'Daily performance indicators for your medical provider operations.',
      widgets: [
        {
          id: 'checks-today',
          label: 'Eligibility checks',
          value: '42',
          detail: 'Completed today across all locations.',
          tone: 'success'
        },
        {
          id: 'auth-pending',
          label: 'Auths pending',
          value: '11',
          detail: 'Require documentation or payer response.',
          tone: 'warning'
        },
        {
          id: 'claims-at-risk',
          label: 'Claims at risk',
          value: '7',
          detail: 'Need correction before filing deadline.',
          tone: 'danger'
        },
        {
          id: 'remits-posted',
          label: 'Remits posted',
          value: '$84,220',
          detail: 'ERA posted in the current cycle.',
          tone: 'info'
        }
      ]
    }
  ],
  quickActions: [
    {
      id: 'start-eligibility',
      href: '/provider/eligibility',
      label: 'Start eligibility check',
      description: 'Launch a new coverage verification workflow.',
      icon: 'EL'
    },
    {
      id: 'new-authorization',
      href: '/provider/authorizations',
      label: 'Create authorization',
      description: 'Open a prior auth request with supporting details.',
      icon: 'PA'
    },
    {
      id: 'submit-claim',
      href: '/provider/claims',
      label: 'Submit claim',
      description: 'Start a new claim submission and claim edit checks.',
      icon: 'CL'
    },
    {
      id: 'check-claim-status',
      href: '/provider/claims',
      label: 'Check claim status',
      description: 'Review claim status and recent adjudication updates.',
      icon: 'CS'
    },
    {
      id: 'payment-remit',
      href: '/provider/payments',
      label: 'View remits',
      description: 'Open payment and remit reconciliation summaries.',
      icon: 'PM'
    },
    {
      id: 'patient-search',
      href: '/provider/patients',
      label: 'Patient search',
      description: 'Find a patient record and recent payer interactions.',
      icon: 'PT'
    },
    {
      id: 'resource-library',
      href: '/provider/documents',
      label: 'Open provider resources',
      description: 'Browse provider manuals and policy references.',
      icon: 'PR'
    },
    {
      id: 'compose-message',
      href: '/provider/messages',
      label: 'Compose message',
      description: 'Start a secure message with payer operations.',
      icon: 'MS'
    },
    {
      id: 'open-support-ticket',
      href: '/provider/support',
      label: 'Open support ticket',
      description: 'Create a support request with category and urgency.',
      icon: 'TK'
    },
    {
      id: 'manage-users',
      href: '/provider/admin',
      label: 'Manage users',
      description: 'Invite users and assign office-level permissions.',
      icon: 'US'
    }
  ],
  documentCategories: [
    {
      id: 'medical-policy',
      label: 'Medical policies',
      description: 'Current policies and updates for covered services.'
    },
    {
      id: 'remittance',
      label: 'Remittance files',
      description: 'ERA and reconciliation documentation.'
    },
    {
      id: 'clinical-attachments',
      label: 'Clinical attachments',
      description: 'Supporting documents for prior authorization and appeals.'
    }
  ],
  providerResources: [
    {
      id: 'provider-manual',
      category: 'Manuals',
      title: 'Provider Manual',
      type: 'Manual',
      description: 'Core operational guidance for provider participation and workflows.',
      tags: ['manual', 'operations', 'medical'],
      lineOfBusinessApplicability: ['Medical'],
      lastUpdated: 'Placeholder - 2026-03-01',
      linkTarget: '/provider/documents/provider-manual',
      linkType: 'internal'
    },
    {
      id: 'claims-submission-guide',
      category: 'Claims Resources',
      title: 'Claims Submission Guide',
      type: 'Guide',
      description: 'Submission rules, coding reminders, and common claim edits.',
      tags: ['claims', 'submission', 'billing'],
      lineOfBusinessApplicability: ['Medical'],
      lastUpdated: 'Placeholder - 2026-02-21',
      linkTarget: '/provider/claims',
      linkType: 'internal'
    },
    {
      id: 'prior-authorization-guide',
      category: 'Authorization Resources',
      title: 'Prior Authorization Guide',
      type: 'Guide',
      description: 'How to determine requirements and submit complete prior auth requests.',
      tags: ['authorization', 'clinical', 'workflow'],
      lineOfBusinessApplicability: ['Medical'],
      lastUpdated: 'Placeholder - 2026-02-18',
      linkTarget: '/provider/authorizations',
      linkType: 'internal'
    },
    {
      id: 'payment-remittance-guide',
      category: 'Payment Resources',
      title: 'Payment / Remittance Guide',
      type: 'Guide',
      description: 'EFT/ERA mapping, reconciliation practices, and payment follow-up.',
      tags: ['payments', 'remittance', 'era'],
      lineOfBusinessApplicability: ['Medical'],
      lastUpdated: 'Placeholder - 2026-02-12',
      linkTarget: '/provider/payments',
      linkType: 'internal'
    },
    {
      id: 'demographic-update-form',
      category: 'Forms',
      title: 'Demographic Update Form',
      type: 'Form',
      description: 'Update provider demographic and practice information.',
      tags: ['form', 'demographics', 'administration'],
      lineOfBusinessApplicability: ['Medical', 'Pharmacy', 'Dental', 'Vision'],
      lastUpdated: 'Placeholder - 2026-01-30',
      linkTarget: '/placeholder-downloads/demographic-update-form.pdf',
      linkType: 'download'
    },
    {
      id: 'provider-training-resources',
      category: 'Training',
      title: 'Provider Training Resources',
      type: 'Training',
      description: 'Role-based onboarding and workflow training materials.',
      tags: ['training', 'onboarding', 'education'],
      lineOfBusinessApplicability: ['Medical'],
      lastUpdated: 'Placeholder - 2026-02-25',
      linkTarget: 'https://example.com/provider-training',
      linkType: 'external'
    },
    {
      id: 'contact-escalation-guide',
      category: 'Practice Administration',
      title: 'Contact / Escalation Guide',
      type: 'Directory',
      description: 'Support channels, escalation paths, and response-time expectations.',
      tags: ['support', 'escalation', 'contacts'],
      lineOfBusinessApplicability: ['Medical'],
      lastUpdated: 'Placeholder - 2026-03-04',
      linkTarget: '/provider/support',
      linkType: 'internal'
    },
    {
      id: 'medical-policy-bulletin',
      category: 'Policies',
      title: 'Medical Policy Bulletin',
      type: 'Policy',
      description: 'Policy and protocol updates for medical prior auth and claims adjudication.',
      tags: ['policy', 'protocol', 'medical'],
      lineOfBusinessApplicability: ['Medical'],
      lastUpdated: 'Placeholder - 2026-03-10',
      linkTarget: '/provider/documents/policies',
      linkType: 'internal'
    }
  ],
  supportLinks: [
    {
      id: 'provider-rep',
      href: '/provider/support',
      label: 'Contact provider representative',
      description: 'View your assigned rep and escalation path.'
    },
    {
      id: 'technical-support',
      href: '/provider/support',
      label: 'Technical support',
      description: 'Get help with portal access and submission issues.'
    },
    {
      id: 'claims-escalation',
      href: '/provider/support',
      label: 'Claims escalation',
      description: 'Escalate unresolved claim/payment issues.'
    }
  ],
  authorizationsModule: {
    labels: {
      title: 'Prior authorizations and referrals',
      description:
        'Check requirements, submit requests, attach clinical documentation, and track decisions in one workflow.',
      checkRequirement: 'Check Requirement',
      submitRequest: 'Submit Request',
      trackRequests: 'Track Requests',
      referrals: 'Referrals',
      attachments: 'Attachments / Clinical Docs',
      requestTerm: 'Prior Authorization',
      referralTerm: 'Referral'
    }
  },
  messagesModule: {
    categories: [
      'Operational Updates',
      'Authorization Updates',
      'Claims / Payment Notices',
      'Policy Changes',
      'Training / Education',
      'Maintenance Notices'
    ],
    inbox: [
      {
        id: 'msg-ops-1',
        subject: 'Daily operational digest available',
        preview: 'Morning queue summary and follow-up priorities are ready for review.',
        body: 'Your daily operational digest is now available with eligibility, authorization, and claims follow-up priorities for all active locations.',
        category: 'Operational Updates',
        date: '2026-03-15',
        unread: true,
        actionRequired: false,
        priority: 'Medium'
      },
      {
        id: 'msg-auth-1',
        subject: 'Additional documentation required for PA-100233',
        preview: 'Payer requested additional clinical rationale for prior authorization.',
        body: 'Prior authorization PA-100233 requires additional clinical rationale and chart notes before review can continue. Please upload documents before end of day.',
        category: 'Authorization Updates',
        date: '2026-03-14',
        unread: true,
        actionRequired: true,
        priority: 'High'
      },
      {
        id: 'msg-claims-1',
        subject: 'Claim CLM-100245 payment posted',
        preview: 'Payment has been posted with remittance detail available.',
        body: 'Claim CLM-100245 has moved to paid status. Remittance details are now available in the payments workspace and can be downloaded.',
        category: 'Claims / Payment Notices',
        date: '2026-03-14',
        unread: false,
        actionRequired: false,
        priority: 'Low'
      },
      {
        id: 'msg-policy-1',
        subject: 'Medical policy update effective next cycle',
        preview: 'Outpatient imaging policy criteria have changed.',
        body: 'Outpatient imaging policy criteria and documentation requirements have been updated. Review the policy bulletin in provider resources.',
        category: 'Policy Changes',
        date: '2026-03-13',
        unread: true,
        actionRequired: true,
        priority: 'High'
      },
      {
        id: 'msg-training-1',
        subject: 'New prior authorization training module',
        preview: 'A new training module is available for clinical staff.',
        body: 'A new training module covering prior authorization best practices is now available in training resources.',
        category: 'Training / Education',
        date: '2026-03-12',
        unread: false,
        actionRequired: false,
        priority: 'Medium'
      },
      {
        id: 'msg-maint-1',
        subject: 'Scheduled maintenance this weekend',
        preview: 'Claims status service window planned Sunday 2-4 AM ET.',
        body: 'Scheduled maintenance will occur Sunday between 2:00 AM and 4:00 AM ET. Claims status and remittance downloads may be temporarily delayed.',
        category: 'Maintenance Notices',
        date: '2026-03-11',
        unread: true,
        actionRequired: false,
        priority: 'Medium'
      }
    ],
    announcements: [
      {
        id: 'ann-banner-1',
        title: 'Action required: Policy update acknowledgment',
        message: 'Please review and acknowledge the latest outpatient imaging policy update.',
        type: 'banner',
        date: '2026-03-15'
      },
      {
        id: 'ann-info-1',
        title: 'Informational notice',
        message: 'Provider operations office hours have been extended this week.',
        type: 'info',
        date: '2026-03-14'
      },
      {
        id: 'ann-maint-1',
        title: 'Scheduled maintenance',
        message: 'Claims and payments services maintenance: Sunday, 2:00 AM - 4:00 AM ET.',
        type: 'maintenance',
        date: '2026-03-14'
      }
    ]
  },
  supportModule: {
    title: 'Provider Support and Training Center',
    description:
      'Access support channels, operational guidance, and training resources for office workflows.',
    categories: [
      'Claims Support',
      'Eligibility Support',
      'Authorization Support',
      'Portal Technical Support',
      'Provider Data / Demographics',
      'Payments / EFT / ERA'
    ],
    cards: [
      {
        id: 'contact-support',
        title: 'Contact Support',
        description: 'Connect with provider support for operational assistance.',
        href: '/provider/support/contact'
      },
      {
        id: 'open-support-case',
        title: 'Open Support Case',
        description: 'Start a support request and track status (placeholder).',
        href: '/provider/support/cases'
      },
      {
        id: 'training-resources',
        title: 'Training Resources',
        description: 'Browse role-based training for provider workflows.',
        href: '/provider/documents'
      },
      {
        id: 'faq',
        title: 'FAQ',
        description: 'Find answers to common claims, eligibility, and auth questions.',
        href: '/provider/support/faq'
      },
      {
        id: 'system-status',
        title: 'System Status',
        description: 'View portal and service health (placeholder).',
        href: '/provider/support/status'
      }
    ],
    trainingBlocks: [
      {
        id: 'portal-onboarding',
        title: 'Portal Onboarding',
        description: 'Get started with navigation, account setup, and key office workflows.',
        href: '/provider/documents?category=Training'
      },
      {
        id: 'claims-training',
        title: 'Claims Training',
        description: 'Improve clean claim rates with coding and submission best practices.',
        href: '/provider/claims'
      },
      {
        id: 'eligibility-training',
        title: 'Eligibility Training',
        description: 'Learn efficient eligibility verification patterns for front-desk teams.',
        href: '/provider/eligibility'
      },
      {
        id: 'authorization-training',
        title: 'Authorization Training',
        description: 'Submit complete authorization requests with fewer follow-ups.',
        href: '/provider/authorizations'
      }
    ],
    quickLinks: [
      {
        id: 'chat',
        label: 'Chat',
        value: 'Placeholder chat support',
        href: '/provider/support/chat'
      },
      {
        id: 'phone',
        label: 'Phone',
        value: 'Placeholder phone line',
        href: 'tel:+18005550199'
      },
      {
        id: 'email',
        label: 'Email',
        value: 'Placeholder support email',
        href: 'mailto:provider-support@example.com'
      },
      {
        id: 'help-center',
        label: 'Help Center',
        value: 'Placeholder knowledge center',
        href: '/provider/support/help-center'
      }
    ]
  },
  adminModule: {
    title: 'Provider Admin and Practice Management',
    description:
      'Manage practice-level administration, user access, locations, rendering providers, and preferences.',
    enabledSections: [
      'User Access',
      'Practice Information',
      'Locations',
      'Rendering Providers',
      'Notification Preferences',
      'Linked Tax IDs / NPIs'
    ],
    userAccessRoles: [
      {
        role: 'admin users',
        count: 3,
        description: 'Manage practice settings, users, and escalations.'
      },
      {
        role: 'standard staff',
        count: 11,
        description: 'Daily portal users for operational workflows.'
      },
      {
        role: 'billing users',
        count: 4,
        description: 'Focused on claims and payment workflows.'
      },
      {
        role: 'authorization users',
        count: 5,
        description: 'Manage prior authorization and referral submissions.'
      },
      {
        role: 'read-only users',
        count: 2,
        description: 'View access for reporting and oversight.'
      }
    ],
    practiceInformation: {
      practiceName: 'Riverside Health Group',
      npi: '1234567890',
      tin: '12-3456789',
      address: '1250 East Medical Parkway, Detroit, MI 48201',
      phone: '(313) 555-0123',
      primaryContact: 'Jordan Lee, MD',
      specialty: 'Placeholder - Multi-specialty Internal Medicine'
    },
    locations: [
      {
        id: 'loc-1',
        name: 'Downtown Clinic',
        officeHours: 'Placeholder - Mon-Fri 8:00 AM to 5:00 PM',
        address: '1250 East Medical Parkway, Detroit, MI 48201',
        status: 'Active'
      },
      {
        id: 'loc-2',
        name: 'North Medical Office',
        officeHours: 'Placeholder - Mon-Fri 9:00 AM to 6:00 PM',
        address: '2080 North River Road, Troy, MI 48084',
        status: 'Active'
      },
      {
        id: 'loc-3',
        name: 'Virtual Care Team',
        officeHours: 'Placeholder - Mon-Sat 7:00 AM to 7:00 PM',
        address: 'Virtual / Telehealth',
        status: 'Inactive'
      }
    ],
    renderingProviders: [
      { id: 'rp-1', name: 'Jordan Lee, MD', specialty: 'Primary Care', status: 'Active' },
      { id: 'rp-2', name: 'Avery Brooks, NP', specialty: 'Family Medicine', status: 'Active' },
      { id: 'rp-3', name: 'Taylor Nguyen, MD', specialty: 'Internal Medicine', status: 'Inactive' }
    ],
    notificationPreferences: [
      {
        id: 'np-1',
        channel: 'Email',
        topic: 'Claims / Payment Notices',
        enabled: true
      },
      {
        id: 'np-2',
        channel: 'Portal',
        topic: 'Authorization Updates',
        enabled: true
      },
      {
        id: 'np-3',
        channel: 'SMS',
        topic: 'Maintenance Notices',
        enabled: false
      }
    ],
    linkedIdentifiers: [
      { id: 'li-1', type: 'TIN', value: '12-3456789', status: 'Linked (Placeholder)' },
      { id: 'li-2', type: 'NPI', value: '1234567890', status: 'Linked (Placeholder)' },
      { id: 'li-3', type: 'NPI', value: '1987654321', status: 'Pending Verification (Placeholder)' }
    ]
  },
  featureFlags: {
    eligibilityWorkbench: true,
    referralRouting: true,
    claimsSubmission: true,
    remittanceReconciliation: true,
    providerMessaging: true,
    adminUserManagement: true,
    medicalProviderDashboard: true,
    formularySearch: false,
    specialtyMedicationWorkflow: false,
    providerLookup: false,
    dentalBenefitLookup: false,
    visionBenefitLookup: false
  },
  modules: [
    { key: 'dashboard', label: 'Dashboard', href: '/provider/dashboard' },
    {
      key: 'eligibility-benefits',
      label: 'Eligibility & Benefits',
      href: '/provider/eligibility'
    },
    {
      key: 'prior-auth-referrals',
      label: 'Prior Authorizations / Referrals',
      href: '/provider/authorizations'
    },
    { key: 'claims-payments', label: 'Claims & Payments', href: '/provider/claims' },
    { key: 'patients', label: 'Patients', href: '/provider/patients' },
    {
      key: 'provider-resources',
      label: 'Provider Resources',
      href: '/provider/documents'
    },
    { key: 'messages', label: 'Messages', href: '/provider/messages' },
    { key: 'support', label: 'Support', href: '/provider/support' },
    { key: 'admin', label: 'Admin', href: '/provider/admin' }
  ],
  routeContent: {
    dashboard: {
      title: 'Provider dashboard',
      description:
        'Review your most important tasks first: patient checks, pending submissions, payment status, and team activity.',
      highlights: [
        'Prioritize urgent eligibility tasks.',
        'Track pending authorization decisions.',
        'Surface claims and payment follow-up.'
      ],
      quickActionIds: ['start-eligibility', 'new-authorization', 'submit-claim', 'payment-remit']
    },
    eligibility: {
      title: 'Eligibility & benefits',
      description:
        'Validate member coverage and service eligibility quickly before appointments and procedures.',
      highlights: [
        'Batch verification for scheduled visits.',
        'Benefit snapshot by member and service.',
        'Coverage and copay indicators for front desk.'
      ],
      quickActionIds: ['start-eligibility']
    },
    authorizations: {
      title: 'Prior authorizations / referrals',
      description:
        'Track prior authorization and referral submissions from intake through payer decision.',
      highlights: [
        'Prioritize urgent requests and referral expirations.',
        'Track attachment completeness.',
        'Follow turnaround timelines and escalations.'
      ],
      quickActionIds: ['new-authorization']
    },
    claims: {
      title: 'Claims & payments',
      description:
        'Submit claims, monitor adjudication, and keep payment activities visible to billing teams.',
      highlights: [
        'Pre-submit edit checks and validation.',
        'Claim status by queue and aging.',
        'Denial and correction workflows.'
      ],
      quickActionIds: ['submit-claim', 'payment-remit']
    },
    payments: {
      title: 'Payments',
      description:
        'Monitor remittance activity, outstanding balances, and reconciliation actions in one place.',
      highlights: [
        'ERA posting checklist and variance review.',
        'A/R aging visibility by payer.',
        'Export-ready reconciliation notes.'
      ],
      quickActionIds: ['payment-remit']
    },
    patients: {
      title: 'Patients',
      description:
        'Access attributed patient lists, plan details, and outreach-ready details at point of care.',
      highlights: [
        'Filter roster by location and provider.',
        'Review coverage and PCP indicators.',
        'Track high-priority patient follow-up tasks.'
      ],
      quickActionIds: ['patient-search']
    },
    documents: {
      title: 'Provider resources',
      description:
        'Browse policy references, forms, and operational documentation used by medical providers.',
      highlights: [
        'Medical policy library.',
        'Claims and remittance documentation.',
        'Authorization and referral forms.'
      ],
      quickActionIds: ['resource-library']
    },
    messages: {
      title: 'Messages',
      description:
        'Coordinate with payer operations, care management, and internal teams through secure messaging.',
      highlights: [
        'Route urgent messages to the right team.',
        'Use templates for common provider requests.',
        'Track response SLAs.'
      ],
      quickActionIds: ['compose-message']
    },
    support: {
      title: 'Support',
      description:
        'Find support resources, escalation paths, and operational contacts for provider workflows.',
      highlights: [
        'Claims and payment escalation paths.',
        'Authorization support channels.',
        'Technical portal support options.'
      ],
      quickActionIds: ['open-support-ticket']
    },
    admin: {
      title: 'Admin',
      description:
        'Manage office-level settings, user access, and routing preferences for your organization.',
      highlights: [
        'Invite and deactivate users.',
        'Assign access by office location.',
        'Maintain NPI/TIN and practice profile settings.'
      ],
      quickActionIds: ['manage-users']
    }
  },
  shellDescription:
    'Manage eligibility, authorizations, claims, and payments from a provider-first workflow shell.',
  notificationsTitle: 'Medical operations alerts',
  providerRoleLabel: 'Medical provider',
  providerContext: {
    practiceName: 'Riverside Health Group',
    providerName: 'Jordan Lee, MD',
    npi: '1234567890',
    tin: '12-3456789',
    locations: [
      { id: 'downtown', label: 'Downtown Clinic' },
      { id: 'north', label: 'North Medical Office' },
      { id: 'virtual', label: 'Virtual Care Team' }
    ],
    selectedLocationId: 'downtown'
  },
  notifications: [
    {
      id: 'notif-auth',
      title: 'Authorization due today',
      message: '2 prior authorization requests need clinical attachments before 5:00 PM.',
      tone: 'warning'
    },
    {
      id: 'notif-payment',
      title: 'ERA posted',
      message: 'A new remittance file was posted for your selected location this morning.',
      tone: 'success'
    },
    {
      id: 'notif-policy',
      title: 'Policy update',
      message: 'Medical policy updates for outpatient imaging are available in Provider Resources.',
      tone: 'info'
    }
  ]
};

function cloneMedicalAsBase(
  portalType: ProviderPortalVariant,
  displayName: string,
  overrides: Partial<ProviderPortalConfig>
): ProviderPortalConfig {
  return {
    ...medicalConfig,
    ...overrides,
    portalType,
    displayName,
    navItems: overrides.navItems ?? medicalConfig.navItems,
    dashboardSections: overrides.dashboardSections ?? medicalConfig.dashboardSections,
    quickActions: overrides.quickActions ?? medicalConfig.quickActions,
    documentCategories: overrides.documentCategories ?? medicalConfig.documentCategories,
    providerResources: overrides.providerResources ?? medicalConfig.providerResources,
    supportLinks: overrides.supportLinks ?? medicalConfig.supportLinks,
    authorizationsModule:
      overrides.authorizationsModule ?? medicalConfig.authorizationsModule,
    messagesModule: overrides.messagesModule ?? medicalConfig.messagesModule,
    supportModule: overrides.supportModule ?? medicalConfig.supportModule,
    adminModule: overrides.adminModule ?? medicalConfig.adminModule,
    featureFlags: {
      ...medicalConfig.featureFlags,
      ...(overrides.featureFlags ?? {})
    },
    modules: overrides.modules ?? medicalConfig.modules,
    routeContent: {
      ...medicalConfig.routeContent,
      ...(overrides.routeContent ?? {})
    },
    providerContext: {
      ...medicalConfig.providerContext,
      ...(overrides.providerContext ?? {})
    },
    notifications: overrides.notifications ?? medicalConfig.notifications
  };
}

const pharmacyConfig = cloneMedicalAsBase('pharmacy', 'Pharmacy Provider Portal', {
  navItems: [
    { key: 'dashboard', href: '/provider/dashboard', label: 'Dashboard', icon: 'home' },
    {
      key: 'eligibility',
      href: '/provider/eligibility',
      label: 'Formulary / Drug Search',
      icon: 'shield-check'
    },
    {
      key: 'authorizations',
      href: '/provider/authorizations',
      label: 'Pharmacy Prior Auth',
      icon: 'clipboard-list'
    },
    {
      key: 'claims',
      href: '/provider/claims',
      label: 'Pharmacy Claims',
      icon: 'file-text'
    },
    {
      key: 'payments',
      href: '/provider/payments',
      label: 'Pharmacy Payments',
      icon: 'wallet'
    },
    { key: 'patients', href: '/provider/patients', label: 'Patients', icon: 'users' },
    {
      key: 'documents',
      href: '/provider/documents',
      label: 'Specialty Workflows',
      icon: 'folder-open'
    },
    { key: 'messages', href: '/provider/messages', label: 'Messages', icon: 'mail' },
    { key: 'support', href: '/provider/support', label: 'Support', icon: 'life-buoy' },
    { key: 'admin', href: '/provider/admin', label: 'Admin', icon: 'settings' }
  ],
  shellDescription:
    'Manage formulary lookup, pharmacy prior authorizations, specialty medication workflows, and pharmacy claims.',
  notificationsTitle: 'Pharmacy operations alerts',
  providerRoleLabel: 'Pharmacy provider',
  providerContext: {
    practiceName: 'Riverside Specialty Pharmacy',
    providerName: 'Jordan Lee, PharmD',
    npi: '1987654321',
    tin: '98-7654321',
    locations: [
      { id: 'dispensing', label: 'Main Dispensing Site' },
      { id: 'mail', label: 'Mail Order Fulfillment' },
      { id: 'infusion', label: 'Infusion Center' }
    ],
    selectedLocationId: 'dispensing'
  },
  documentCategories: [
    {
      id: 'formulary-guides',
      label: 'Formulary guides',
      description: 'Drug coverage and tier references.'
    },
    {
      id: 'specialty-pathways',
      label: 'Specialty medication workflows',
      description: 'Clinical and dispensing pathway references.'
    }
  ],
  providerResources: [
    {
      id: 'pharmacy-formulary-reference',
      category: 'Policies',
      title: 'Formulary and Drug Policy Reference',
      type: 'Policy',
      description: 'Formulary tiers, utilization edits, and drug policy updates.',
      tags: ['formulary', 'drug policy', 'pharmacy'],
      lineOfBusinessApplicability: ['Pharmacy'],
      lastUpdated: 'Placeholder - 2026-03-08',
      linkTarget: '/provider/documents/formulary',
      linkType: 'internal'
    },
    {
      id: 'specialty-medication-training',
      category: 'Training',
      title: 'Specialty Medication Workflow Training',
      type: 'Training',
      description: 'Training resources for specialty intake and prior auth routing.',
      tags: ['specialty', 'training', 'pharmacy'],
      lineOfBusinessApplicability: ['Pharmacy'],
      lastUpdated: 'Placeholder - 2026-03-03',
      linkTarget: 'https://example.com/pharmacy-specialty-training',
      linkType: 'external'
    }
  ],
  authorizationsModule: {
    labels: {
      title: 'Pharmacy authorizations and referrals',
      description:
        'Manage pharmacy prior authorizations, specialty medication requests, and referral coordination.',
      checkRequirement: 'Check Requirement',
      submitRequest: 'Submit Request',
      trackRequests: 'Track Requests',
      referrals: 'Referrals',
      attachments: 'Attachments / Clinical Docs',
      requestTerm: 'Pharmacy Prior Authorization',
      referralTerm: 'Referral'
    }
  },
  messagesModule: {
    categories: medicalConfig.messagesModule.categories,
    inbox: [
      {
        id: 'msg-pharm-1',
        subject: 'Formulary update for specialty medications',
        preview: 'Tiering updates now in effect for select medications.',
        body: 'Formulary tiering updates for specialty medications are now in effect. Please review alternatives and prior auth requirements.',
        category: 'Policy Changes',
        date: '2026-03-14',
        unread: true,
        actionRequired: true,
        priority: 'High'
      },
      ...medicalConfig.messagesModule.inbox.slice(0, 3)
    ],
    announcements: medicalConfig.messagesModule.announcements
  },
  supportModule: {
    ...medicalConfig.supportModule,
    title: 'Pharmacy Support and Training Center',
    description:
      'Support resources for formulary, specialty medication workflows, and pharmacy operations.'
  },
  adminModule: {
    ...medicalConfig.adminModule,
    title: 'Pharmacy Admin and Practice Management',
    description:
      'Practice administration and access controls for pharmacy operations.',
    practiceInformation: {
      ...medicalConfig.adminModule.practiceInformation,
      practiceName: 'Riverside Specialty Pharmacy',
      npi: '1987654321',
      tin: '98-7654321',
      specialty: 'Placeholder - Specialty Pharmacy'
    }
  },
  routeContent: {
    ...medicalConfig.routeContent,
    eligibility: {
      title: 'Formulary / drug search',
      description: 'Search coverage, alternatives, and utilization requirements by medication.',
      highlights: [
        'Drug tier and prior auth requirements.',
        'Step therapy and quantity limit indicators.',
        'Preferred alternatives by line of business.'
      ],
      quickActionIds: ['start-eligibility']
    },
    authorizations: {
      title: 'Pharmacy prior authorization',
      description: 'Submit and track medication prior auth requests and supporting details.',
      highlights: [
        'PA status and turnaround timers.',
        'Attachment and chart-note completeness.',
        'Escalations for urgent therapies.'
      ],
      quickActionIds: ['new-authorization']
    },
    documents: {
      title: 'Specialty medication workflows',
      description: 'Manage specialty medication intake and coordination resources.',
      highlights: [
        'Specialty care pathways.',
        'Infusion and home-delivery coordination notes.',
        'Clinical handoff checklists.'
      ],
      quickActionIds: ['resource-library']
    }
  },
  featureFlags: {
    formularySearch: true,
    specialtyMedicationWorkflow: true
  }
});

const dentalConfig = cloneMedicalAsBase('dental', 'Dental Provider Portal', {
  navItems: [
    { key: 'dashboard', href: '/provider/dashboard', label: 'Dashboard', icon: 'home' },
    {
      key: 'eligibility',
      href: '/provider/eligibility',
      label: 'Dental Benefits',
      icon: 'shield-check'
    },
    {
      key: 'authorizations',
      href: '/provider/authorizations',
      label: 'Treatment Auth / Referrals',
      icon: 'clipboard-list'
    },
    { key: 'claims', href: '/provider/claims', label: 'Dental Claims', icon: 'file-text' },
    {
      key: 'payments',
      href: '/provider/payments',
      label: 'Dental Remittance',
      icon: 'wallet'
    },
    { key: 'patients', href: '/provider/patients', label: 'Patients', icon: 'users' },
    {
      key: 'documents',
      href: '/provider/documents',
      label: 'Dental Resources',
      icon: 'folder-open'
    },
    { key: 'messages', href: '/provider/messages', label: 'Messages', icon: 'mail' },
    { key: 'support', href: '/provider/support', label: 'Support', icon: 'life-buoy' },
    { key: 'admin', href: '/provider/admin', label: 'Admin', icon: 'settings' }
  ],
  shellDescription:
    'Run dental benefits, treatment authorization, dental claims, remittance, and dental-specific resources.',
  notificationsTitle: 'Dental operations alerts',
  providerRoleLabel: 'Dental provider',
  providerContext: {
    practiceName: 'Riverside Dental Associates',
    providerName: 'Jordan Lee, DDS',
    npi: '1765432198',
    tin: '23-4567890',
    locations: [
      { id: 'main', label: 'Main Dental Office' },
      { id: 'ortho', label: 'Orthodontics Center' }
    ],
    selectedLocationId: 'main'
  },
  documentCategories: [
    {
      id: 'dental-policy',
      label: 'Dental policy manuals',
      description: 'Benefit grids, policy updates, and coding references.'
    },
    {
      id: 'dental-attachments',
      label: 'Dental attachments',
      description: 'X-rays, treatment plans, and supporting forms.'
    }
  ],
  providerResources: [
    {
      id: 'dental-claims-guide',
      category: 'Claims Resources',
      title: 'Dental Claims Submission Guide',
      type: 'Guide',
      description: 'Coding and attachment guidance for dental claims.',
      tags: ['dental', 'claims', 'coding'],
      lineOfBusinessApplicability: ['Dental'],
      lastUpdated: 'Placeholder - 2026-03-06',
      linkTarget: '/provider/claims',
      linkType: 'internal'
    },
    {
      id: 'dental-benefit-policy',
      category: 'Policies',
      title: 'Dental Benefit and Policy Reference',
      type: 'Policy',
      description: 'Coverage frequency, annual limits, and policy notes.',
      tags: ['dental', 'benefits', 'policy'],
      lineOfBusinessApplicability: ['Dental'],
      lastUpdated: 'Placeholder - 2026-03-02',
      linkTarget: '/provider/documents/policies',
      linkType: 'internal'
    }
  ],
  authorizationsModule: {
    labels: {
      title: 'Dental authorizations and referrals',
      description:
        'Submit treatment authorization and referral requests with supporting documentation.',
      checkRequirement: 'Check Requirement',
      submitRequest: 'Submit Request',
      trackRequests: 'Track Requests',
      referrals: 'Referrals',
      attachments: 'Attachments / Clinical Docs',
      requestTerm: 'Dental Treatment Authorization',
      referralTerm: 'Referral'
    }
  },
  messagesModule: {
    categories: medicalConfig.messagesModule.categories,
    inbox: [
      {
        id: 'msg-dental-1',
        subject: 'Dental attachment reminder',
        preview: 'X-ray attachments now required for selected procedures.',
        body: 'Updated requirements include X-ray attachments for selected dental procedure categories. Please review the dental resources guide.',
        category: 'Authorization Updates',
        date: '2026-03-13',
        unread: true,
        actionRequired: true,
        priority: 'High'
      },
      ...medicalConfig.messagesModule.inbox.slice(0, 3)
    ],
    announcements: medicalConfig.messagesModule.announcements
  },
  supportModule: {
    ...medicalConfig.supportModule,
    title: 'Dental Support and Training Center',
    description:
      'Support resources for dental benefits, treatment authorization, and claims operations.'
  },
  adminModule: {
    ...medicalConfig.adminModule,
    title: 'Dental Admin and Practice Management',
    description:
      'Practice administration and access controls for dental operations.',
    practiceInformation: {
      ...medicalConfig.adminModule.practiceInformation,
      practiceName: 'Riverside Dental Associates',
      npi: '1765432198',
      tin: '23-4567890',
      specialty: 'Placeholder - General Dentistry'
    }
  },
  routeContent: {
    ...medicalConfig.routeContent,
    eligibility: {
      title: 'Dental benefits',
      description: 'Verify dental coverage limits, frequencies, and patient responsibility.',
      highlights: [
        'Benefit frequencies and annual maximums.',
        'Waiting period and limitation indicators.',
        'Procedure-specific coverage checks.'
      ],
      quickActionIds: ['start-eligibility']
    },
    claims: {
      title: 'Dental claims',
      description: 'Submit and track dental claims from creation to adjudication.',
      highlights: [
        'Attachment validation for dental claims.',
        'Claim status and denial tracking.',
        'Correction and resubmission support.'
      ],
      quickActionIds: ['submit-claim']
    },
    payments: {
      title: 'Dental remittance',
      description: 'Review remittance details and reconcile dental payment activity.',
      highlights: [
        'Dental remit and payment history.',
        'Line-level payment reconciliation.',
        'Follow-up for unpaid balances.'
      ],
      quickActionIds: ['payment-remit']
    },
    documents: {
      title: 'Dental-specific resources',
      description: 'Access coding guides, attachment requirements, and policy documentation.',
      highlights: [
        'Dental coding references.',
        'Attachment requirement matrices.',
        'Office workflow resources.'
      ],
      quickActionIds: ['resource-library']
    }
  },
  featureFlags: {
    dentalBenefitLookup: true
  }
});

const visionConfig = cloneMedicalAsBase('vision', 'Vision Provider Portal', {
  navItems: [
    { key: 'dashboard', href: '/provider/dashboard', label: 'Dashboard', icon: 'home' },
    {
      key: 'eligibility',
      href: '/provider/eligibility',
      label: 'Vision Benefits',
      icon: 'shield-check'
    },
    {
      key: 'authorizations',
      href: '/provider/authorizations',
      label: 'Authorizations',
      icon: 'clipboard-list'
    },
    {
      key: 'claims',
      href: '/provider/claims',
      label: 'Claim / Payment Views',
      icon: 'file-text'
    },
    { key: 'payments', href: '/provider/payments', label: 'Payments', icon: 'wallet' },
    {
      key: 'patients',
      href: '/provider/patients',
      label: 'Provider Lookup',
      icon: 'users'
    },
    {
      key: 'documents',
      href: '/provider/documents',
      label: 'Documents / Resources',
      icon: 'folder-open'
    },
    { key: 'messages', href: '/provider/messages', label: 'Messages', icon: 'mail' },
    { key: 'support', href: '/provider/support', label: 'Support', icon: 'life-buoy' },
    { key: 'admin', href: '/provider/admin', label: 'Admin', icon: 'settings' }
  ],
  shellDescription:
    'Support vision benefit verification, provider lookup, claim/payment views, and documents/resources.',
  notificationsTitle: 'Vision operations alerts',
  providerRoleLabel: 'Vision provider',
  providerContext: {
    practiceName: 'Riverside Vision Clinic',
    providerName: 'Jordan Lee, OD',
    npi: '1456789023',
    tin: '34-5678901',
    locations: [
      { id: 'optometry', label: 'Optometry Clinic' },
      { id: 'optical', label: 'Optical Retail Center' }
    ],
    selectedLocationId: 'optometry'
  },
  providerResources: [
    {
      id: 'vision-benefits-guide',
      category: 'Manuals',
      title: 'Vision Benefits and Materials Guide',
      type: 'Manual',
      description: 'Reference guide for vision exam and material coverage.',
      tags: ['vision', 'benefits', 'manual'],
      lineOfBusinessApplicability: ['Vision'],
      lastUpdated: 'Placeholder - 2026-03-05',
      linkTarget: '/provider/eligibility',
      linkType: 'internal'
    },
    {
      id: 'vision-office-admin-form',
      category: 'Forms',
      title: 'Vision Practice Administration Form',
      type: 'Form',
      description: 'Maintain office profile and provider roster details.',
      tags: ['vision', 'form', 'administration'],
      lineOfBusinessApplicability: ['Vision'],
      lastUpdated: 'Placeholder - 2026-03-01',
      linkTarget: '/placeholder-downloads/vision-practice-form.pdf',
      linkType: 'download'
    }
  ],
  authorizationsModule: {
    labels: {
      title: 'Vision authorizations and referrals',
      description:
        'Manage vision service authorization checks, submissions, and referral follow-up.',
      checkRequirement: 'Check Requirement',
      submitRequest: 'Submit Request',
      trackRequests: 'Track Requests',
      referrals: 'Referrals',
      attachments: 'Attachments / Clinical Docs',
      requestTerm: 'Vision Authorization',
      referralTerm: 'Referral'
    }
  },
  messagesModule: {
    categories: medicalConfig.messagesModule.categories,
    inbox: [
      {
        id: 'msg-vision-1',
        subject: 'Vision network directory refresh',
        preview: 'Provider lookup data has been refreshed for this cycle.',
        body: 'Vision network directory and provider lookup metadata have been refreshed. Verify office location details for new referrals.',
        category: 'Operational Updates',
        date: '2026-03-15',
        unread: true,
        actionRequired: false,
        priority: 'Medium'
      },
      ...medicalConfig.messagesModule.inbox.slice(0, 3)
    ],
    announcements: medicalConfig.messagesModule.announcements
  },
  supportModule: {
    ...medicalConfig.supportModule,
    title: 'Vision Support and Training Center',
    description:
      'Support resources for vision benefits, provider lookup, and claim/payment workflows.'
  },
  adminModule: {
    ...medicalConfig.adminModule,
    title: 'Vision Admin and Practice Management',
    description:
      'Practice administration and access controls for vision operations.',
    practiceInformation: {
      ...medicalConfig.adminModule.practiceInformation,
      practiceName: 'Riverside Vision Clinic',
      npi: '1456789023',
      tin: '34-5678901',
      specialty: 'Placeholder - Optometry'
    }
  },
  routeContent: {
    ...medicalConfig.routeContent,
    eligibility: {
      title: 'Vision benefits',
      description: 'Validate vision coverage and exam/material eligibility before visits.',
      highlights: [
        'Exam and lens coverage snapshots.',
        'Frame/lens allowance indicators.',
        'Frequency and renewal rules.'
      ],
      quickActionIds: ['start-eligibility']
    },
    patients: {
      title: 'Provider lookup',
      description: 'Find participating vision providers and office details by network and location.',
      highlights: [
        'Network participation lookup.',
        'Location-based search.',
        'Specialty and office capability tags.'
      ],
      quickActionIds: ['patient-search']
    },
    claims: {
      title: 'Claim / payment views',
      description: 'Track vision claim and payment status side by side for billing visibility.',
      highlights: [
        'Claim queue and payment pairing.',
        'Adjustment and remittance visibility.',
        'Aging follow-up summaries.'
      ],
      quickActionIds: ['submit-claim', 'payment-remit']
    },
    documents: {
      title: 'Documents / resources',
      description: 'Access vision policy resources and operational documentation.',
      highlights: [
        'Vision policy references.',
        'Office operational guides.',
        'Form and document templates.'
      ],
      quickActionIds: ['resource-library']
    }
  },
  featureFlags: {
    providerLookup: true,
    visionBenefitLookup: true
  }
});

const providerPortalConfigs: Record<ProviderPortalVariant, ProviderPortalConfig> = {
  medical: medicalConfig,
  pharmacy: pharmacyConfig,
  dental: dentalConfig,
  vision: visionConfig
};

export function isProviderPortalVariant(value: unknown): value is ProviderPortalVariant {
  return value === 'medical' || value === 'pharmacy' || value === 'dental' || value === 'vision';
}

export function resolveProviderPortalVariant(
  brandingConfig?: Record<string, unknown>
): ProviderPortalVariant {
  const value = brandingConfig?.providerPortalLine;

  if (isProviderPortalVariant(value)) {
    return value;
  }

  return 'medical';
}

export function getProviderPortalConfig(variant: ProviderPortalVariant): ProviderPortalConfig {
  return providerPortalConfigs[variant];
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function resolveProviderPortalConfig(
  variant: ProviderPortalVariant,
  brandingConfig?: Record<string, unknown>
): ProviderPortalConfig {
  const baseConfig = getProviderPortalConfig(variant);
  const providerDemoData = asRecord(brandingConfig?.providerDemoData);

  if (!providerDemoData) {
    return baseConfig;
  }

  const messagesModule = asRecord(providerDemoData.messagesModule);
  const supportModule = asRecord(providerDemoData.supportModule);
  const providerContext = asRecord(providerDemoData.providerContext);
  const adminModule = asRecord(providerDemoData.adminModule);
  const demoData = asRecord(providerDemoData.demoData);

  return {
    ...baseConfig,
    displayName:
      typeof providerDemoData.displayName === 'string'
        ? providerDemoData.displayName
        : baseConfig.displayName,
    dashboardSections: Array.isArray(providerDemoData.dashboardSections)
      ? (providerDemoData.dashboardSections as ProviderDashboardSection[])
      : baseConfig.dashboardSections,
    quickActions: Array.isArray(providerDemoData.quickActions)
      ? (providerDemoData.quickActions as ProviderQuickAction[])
      : baseConfig.quickActions,
    providerResources: Array.isArray(providerDemoData.providerResources)
      ? (providerDemoData.providerResources as ProviderResourceItem[])
      : baseConfig.providerResources,
    notifications: Array.isArray(providerDemoData.notifications)
      ? (providerDemoData.notifications as ProviderNotificationsAreaItem[])
      : baseConfig.notifications,
    messagesModule: messagesModule
      ? {
          ...baseConfig.messagesModule,
          ...(Array.isArray(messagesModule.categories)
            ? { categories: messagesModule.categories as ProviderMessageCategory[] }
            : {}),
          ...(Array.isArray(messagesModule.inbox)
            ? { inbox: messagesModule.inbox as ProviderMessageItem[] }
            : {}),
          ...(Array.isArray(messagesModule.announcements)
            ? { announcements: messagesModule.announcements as ProviderAnnouncementItem[] }
            : {})
        }
      : baseConfig.messagesModule,
    supportModule: supportModule
      ? {
          ...baseConfig.supportModule,
          ...(typeof supportModule.title === 'string'
            ? { title: supportModule.title }
            : {}),
          ...(typeof supportModule.description === 'string'
            ? { description: supportModule.description }
            : {}),
          ...(Array.isArray(supportModule.categories)
            ? { categories: supportModule.categories as ProviderSupportCategory[] }
            : {}),
          ...(Array.isArray(supportModule.cards)
            ? { cards: supportModule.cards as ProviderSupportCard[] }
            : {}),
          ...(Array.isArray(supportModule.trainingBlocks)
            ? { trainingBlocks: supportModule.trainingBlocks as ProviderTrainingBlock[] }
            : {}),
          ...(Array.isArray(supportModule.quickLinks)
            ? { quickLinks: supportModule.quickLinks as ProviderSupportQuickLink[] }
            : {})
        }
      : baseConfig.supportModule,
    providerContext: providerContext
      ? {
          ...baseConfig.providerContext,
          ...(typeof providerContext.practiceName === 'string'
            ? { practiceName: providerContext.practiceName }
            : {}),
          ...(typeof providerContext.providerName === 'string'
            ? { providerName: providerContext.providerName }
            : {}),
          ...(typeof providerContext.npi === 'string'
            ? { npi: providerContext.npi }
            : {}),
          ...(typeof providerContext.tin === 'string'
            ? { tin: providerContext.tin }
            : {}),
          ...(Array.isArray(providerContext.locations)
            ? { locations: providerContext.locations as Array<{ id: string; label: string }> }
            : {}),
          ...(typeof providerContext.selectedLocationId === 'string'
            ? { selectedLocationId: providerContext.selectedLocationId }
            : {})
        }
      : baseConfig.providerContext,
    adminModule: adminModule
      ? {
          ...baseConfig.adminModule,
          ...(Array.isArray(adminModule.userAccessRoles)
            ? { userAccessRoles: adminModule.userAccessRoles as ProviderAdminUserRole[] }
            : {}),
          ...(asRecord(adminModule.practiceInformation)
            ? { practiceInformation: adminModule.practiceInformation as ProviderAdminPracticeInfo }
            : {}),
          ...(Array.isArray(adminModule.locations)
            ? { locations: adminModule.locations as ProviderAdminLocationItem[] }
            : {}),
          ...(Array.isArray(adminModule.renderingProviders)
            ? { renderingProviders: adminModule.renderingProviders as ProviderAdminRenderingProvider[] }
            : {}),
          ...(Array.isArray(adminModule.notificationPreferences)
            ? { notificationPreferences: adminModule.notificationPreferences as ProviderAdminNotificationPreference[] }
            : {}),
          ...(Array.isArray(adminModule.linkedIdentifiers)
            ? { linkedIdentifiers: adminModule.linkedIdentifiers as ProviderAdminLinkedIdentifier[] }
            : {})
        }
      : baseConfig.adminModule,
    demoData: demoData
      ? {
          ...(Array.isArray(demoData.eligibilityResults)
            ? { eligibilityResults: demoData.eligibilityResults as ProviderEligibilityResultItem[] }
            : {}),
          ...(Array.isArray(demoData.trackedAuthorizations)
            ? { trackedAuthorizations: demoData.trackedAuthorizations as ProviderTrackedAuthorizationItem[] }
            : {}),
          ...(Array.isArray(demoData.referrals)
            ? { referrals: demoData.referrals as ProviderReferralItem[] }
            : {}),
          ...(Array.isArray(demoData.claimsRows)
            ? { claimsRows: demoData.claimsRows as ProviderClaimRow[] }
            : {}),
          ...(Array.isArray(demoData.paymentRows)
            ? { paymentRows: demoData.paymentRows as ProviderPaymentRow[] }
            : {}),
          ...(Array.isArray(demoData.dashboardMetrics)
            ? { dashboardMetrics: demoData.dashboardMetrics as ProviderDashboardMetricItem[] }
            : {}),
          ...(Array.isArray(demoData.dashboardAuthorizationQueue)
            ? { dashboardAuthorizationQueue: demoData.dashboardAuthorizationQueue as ProviderDashboardQueueItem[] }
            : {}),
          ...(Array.isArray(demoData.dashboardClaimsQueue)
            ? { dashboardClaimsQueue: demoData.dashboardClaimsQueue as ProviderDashboardQueueItem[] }
            : {}),
          ...(Array.isArray(demoData.dashboardAlerts)
            ? { dashboardAlerts: demoData.dashboardAlerts as ProviderDashboardAlertItem[] }
            : {}),
          ...(Array.isArray(demoData.dashboardNotices)
            ? { dashboardNotices: demoData.dashboardNotices as ProviderDashboardNoticeItem[] }
            : {}),
          ...(Array.isArray(demoData.dashboardResources)
            ? { dashboardResources: demoData.dashboardResources as ProviderDashboardResourceItem[] }
            : {})
        }
      : baseConfig.demoData
  };
}

export function getProviderQuickActionsByIds(config: ProviderPortalConfig, ids: string[]) {
  return ids
    .map((id) => config.quickActions.find((action) => action.id === id))
    .filter((action): action is ProviderQuickAction => Boolean(action));
}
