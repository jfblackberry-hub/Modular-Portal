export type EmployerProfile = {
  employerName: string;
  employerId: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  billingAddress: string;
  headquartersAddress: string;
  planYearStart: string;
  planYearEnd: string;
};

export type AdminRole =
  | 'Employer Super Admin'
  | 'Benefits Administrator'
  | 'HR Administrator'
  | 'Billing Administrator'
  | 'Read Only User';

export type AdminModule =
  | 'Employees'
  | 'Enrollments'
  | 'Billing'
  | 'Documents'
  | 'Reports'
  | 'Administration';

export type AccessLevel = 'No Access' | 'View' | 'Edit' | 'Admin';

export type AdministratorUser = {
  id: string;
  userName: string;
  email: string;
  role: AdminRole;
  status: 'Active' | 'Disabled';
  lastLogin?: string;
};

export type RolePermissionMatrix = Record<AdminRole, Record<AdminModule, AccessLevel>>;

export type BillingPreferences = {
  autoPayEnabled: boolean;
  billingContactName: string;
  billingContactEmail: string;
  billingContactPhone: string;
  invoiceDelivery: 'Email' | 'Portal' | 'Email and Portal';
  preferredPaymentMethod: 'ACH' | 'Credit Card' | 'Wire Transfer';
};

export type AdminNotificationPreferences = {
  categories: {
    enrollment: boolean;
    billing: boolean;
    compliance: boolean;
    documents: boolean;
  };
  channels: {
    portal: boolean;
    email: boolean;
    sms: boolean;
  };
};

export type IntegrationConfig = {
  id: string;
  category: 'HRIS' | 'Payroll' | 'Benefits Administration' | 'Third-party Vendor';
  provider: string;
  status: 'Not Configured' | 'Configured' | 'Connection Error';
  notes: string;
};

export type AdminAuditEvent = {
  id: string;
  actor: string;
  actionType: string;
  timestamp: string;
  affectedItem: string;
};

export type EmployerAdministrationSummary = {
  administratorsCount: number;
  activeAdministratorsCount: number;
  billingConfigured: boolean;
  notificationsConfigured: boolean;
  integrationsConfigured: number;
  auditEvents: AdminAuditEvent[];
};

const modules: AdminModule[] = [
  'Employees',
  'Enrollments',
  'Billing',
  'Documents',
  'Reports',
  'Administration'
];

const rolePermissionMatrix: RolePermissionMatrix = {
  'Employer Super Admin': {
    Employees: 'Admin',
    Enrollments: 'Admin',
    Billing: 'Admin',
    Documents: 'Admin',
    Reports: 'Admin',
    Administration: 'Admin'
  },
  'Benefits Administrator': {
    Employees: 'Edit',
    Enrollments: 'Admin',
    Billing: 'View',
    Documents: 'Edit',
    Reports: 'View',
    Administration: 'View'
  },
  'HR Administrator': {
    Employees: 'Admin',
    Enrollments: 'Edit',
    Billing: 'No Access',
    Documents: 'View',
    Reports: 'View',
    Administration: 'View'
  },
  'Billing Administrator': {
    Employees: 'View',
    Enrollments: 'View',
    Billing: 'Admin',
    Documents: 'View',
    Reports: 'Edit',
    Administration: 'View'
  },
  'Read Only User': {
    Employees: 'View',
    Enrollments: 'View',
    Billing: 'View',
    Documents: 'View',
    Reports: 'View',
    Administration: 'No Access'
  }
};

const seedAdministrators: AdministratorUser[] = [
  {
    id: 'admin-901',
    userName: 'Alana Ross',
    email: 'alana.ross@bluehorizon.example',
    role: 'Employer Super Admin',
    status: 'Active',
    lastLogin: '2026-03-16T08:15:00Z'
  },
  {
    id: 'admin-902',
    userName: 'Nina Patel',
    email: 'nina.patel@bluehorizon.example',
    role: 'Benefits Administrator',
    status: 'Active',
    lastLogin: '2026-03-15T14:04:00Z'
  },
  {
    id: 'admin-903',
    userName: 'Marcus Ellis',
    email: 'marcus.ellis@bluehorizon.example',
    role: 'Billing Administrator',
    status: 'Active',
    lastLogin: '2026-03-12T17:29:00Z'
  },
  {
    id: 'admin-904',
    userName: 'Jordan Reese',
    email: 'jordan.reese@bluehorizon.example',
    role: 'Read Only User',
    status: 'Disabled'
  }
];

const seedIntegrations: IntegrationConfig[] = [
  {
    id: 'integration-1001',
    category: 'HRIS',
    provider: 'Workday',
    status: 'Configured',
    notes: 'Daily worker profile sync configured.'
  },
  {
    id: 'integration-1002',
    category: 'HRIS',
    provider: 'BambooHR',
    status: 'Not Configured',
    notes: 'Connector placeholder for future onboarding.'
  },
  {
    id: 'integration-1003',
    category: 'Payroll',
    provider: 'ADP',
    status: 'Not Configured',
    notes: 'Payroll deductions connector placeholder.'
  },
  {
    id: 'integration-1004',
    category: 'Benefits Administration',
    provider: 'Rippling',
    status: 'Connection Error',
    notes: 'Token expired; reconnect required.'
  },
  {
    id: 'integration-1005',
    category: 'Third-party Vendor',
    provider: 'QuickBooks',
    status: 'Not Configured',
    notes: 'Billing exports integration placeholder.'
  }
];

const seedAuditEvents: AdminAuditEvent[] = [
  {
    id: 'audit-admin-1',
    actor: 'Alana Ross',
    actionType: 'Administrator added',
    timestamp: '2026-03-14T13:24:00Z',
    affectedItem: 'Administrator Users'
  },
  {
    id: 'audit-admin-2',
    actor: 'Nina Patel',
    actionType: 'Role permissions updated',
    timestamp: '2026-03-13T09:55:00Z',
    affectedItem: 'Benefits Administrator Role'
  },
  {
    id: 'audit-admin-3',
    actor: 'Marcus Ellis',
    actionType: 'Billing preference changed',
    timestamp: '2026-03-12T16:40:00Z',
    affectedItem: 'Invoice Delivery Preferences'
  },
  {
    id: 'audit-admin-4',
    actor: 'Alana Ross',
    actionType: 'Notification settings updated',
    timestamp: '2026-03-11T11:05:00Z',
    affectedItem: 'Compliance Alerts'
  }
];

function cloneRolePermissions() {
  const entries = Object.entries(rolePermissionMatrix).map(([role, permissions]) => [
    role,
    { ...permissions }
  ]);
  return Object.fromEntries(entries) as RolePermissionMatrix;
}

export function getAdminModules() {
  return [...modules];
}

export function getEmployerProfileForTenant(tenantId: string, tenantName: string): EmployerProfile {
  return {
    employerName: tenantName,
    employerId: `EMP-${tenantId.slice(0, 8).toUpperCase()}`,
    primaryContactName: 'Alana Ross',
    primaryContactEmail: 'alana.ross@bluehorizon.example',
    primaryContactPhone: '(313) 555-0182',
    billingAddress: '1200 Jefferson Ave, Suite 400, Detroit, MI 48226',
    headquartersAddress: '1200 Jefferson Ave, Detroit, MI 48226',
    planYearStart: '2026-01-01',
    planYearEnd: '2026-12-31'
  };
}

export function getAdministratorsForTenant(tenantId: string): AdministratorUser[] {
  const mod = tenantId.length % 2;
  const seeded = seedAdministrators.map((administrator) => ({
    ...administrator,
    id: `${tenantId}-${administrator.id}`
  }));

  if (mod === 1) {
    return seeded.filter((administrator) => administrator.status === 'Active');
  }

  return seeded;
}

export function getRolePermissionMatrixForTenant(_tenantId: string): RolePermissionMatrix {
  return cloneRolePermissions();
}

export function getBillingPreferencesForTenant(_tenantId: string): BillingPreferences {
  return {
    autoPayEnabled: false,
    billingContactName: 'Marcus Ellis',
    billingContactEmail: 'marcus.ellis@bluehorizon.example',
    billingContactPhone: '(313) 555-0104',
    invoiceDelivery: 'Email and Portal',
    preferredPaymentMethod: 'ACH'
  };
}

export function getAdminNotificationPreferencesForTenant(_tenantId: string): AdminNotificationPreferences {
  return {
    categories: {
      enrollment: true,
      billing: true,
      compliance: true,
      documents: true
    },
    channels: {
      portal: true,
      email: true,
      sms: false
    }
  };
}

export function getIntegrationConfigsForTenant(tenantId: string): IntegrationConfig[] {
  return seedIntegrations.map((integration, index) => {
    if (tenantId.length % 3 === 0 && index === 1) {
      return {
        ...integration,
        status: 'Configured',
        notes: 'Sandbox credentials saved for pilot sync.'
      };
    }

    return { ...integration };
  });
}

export function getAdminAuditEventsForTenant(tenantId: string): AdminAuditEvent[] {
  return seedAuditEvents.map((event) => ({
    ...event,
    id: `${tenantId}-${event.id}`
  }));
}

export function getEmployerAdministrationSummaryForTenant(tenantId: string): EmployerAdministrationSummary {
  const administrators = getAdministratorsForTenant(tenantId);
  const billingPreferences = getBillingPreferencesForTenant(tenantId);
  const notificationPreferences = getAdminNotificationPreferencesForTenant(tenantId);
  const integrations = getIntegrationConfigsForTenant(tenantId);
  const auditEvents = getAdminAuditEventsForTenant(tenantId);

  return {
    administratorsCount: administrators.length,
    activeAdministratorsCount: administrators.filter((administrator) => administrator.status === 'Active').length,
    billingConfigured: Boolean(billingPreferences.billingContactEmail && billingPreferences.billingContactName),
    notificationsConfigured: notificationPreferences.channels.portal || notificationPreferences.channels.email,
    integrationsConfigured: integrations.filter((integration) => integration.status === 'Configured').length,
    auditEvents
  };
}
