export type EmployerTaskType =
  | 'Pending Enrollment Approval'
  | 'Eligibility Error'
  | 'Invoice Payment Due'
  | 'Open Enrollment Deadline'
  | 'Compliance Notice Review'
  | 'Document Verification';

export type EmployerTaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type EmployerTaskStatus = 'Open' | 'In Progress' | 'Completed' | 'Expired';

export type AssociatedModule = 'Enrollment' | 'Billing' | 'Compliance' | 'Documents';

export type EmployerTaskRecord = {
  id: string;
  taskType: EmployerTaskType;
  taskDescription: string;
  priority: EmployerTaskPriority;
  associatedEmployee?: string;
  associatedInvoice?: string;
  createdDate: string;
  dueDate: string;
  status: EmployerTaskStatus;
  associatedModule: AssociatedModule;
  actionButtons: string[];
  relatedRecordHref: string;
  auditHistory: Array<{
    id: string;
    action: string;
    actor: string;
    occurredAt: string;
    note?: string;
  }>;
};

export type EmployerNotificationType =
  | 'Enrollment'
  | 'Billing'
  | 'Compliance'
  | 'Documents'
  | 'System';

export type EmployerNotificationPriority = EmployerTaskPriority;

export type EmployerNotificationRecord = {
  id: string;
  notificationType: EmployerNotificationType;
  message: string;
  createdDate: string;
  readStatus: 'Read' | 'Unread';
  priority: EmployerNotificationPriority;
};

export type EmployerNotificationPreferences = {
  portalNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  categories: Record<EmployerNotificationType, boolean>;
};

const seedTasks: EmployerTaskRecord[] = [
  {
    id: 'task-401',
    taskType: 'Pending Enrollment Approval',
    taskDescription: 'Approve pending enrollment changes for Q2 cycle.',
    priority: 'High',
    associatedEmployee: 'Priya Shah',
    createdDate: '2026-03-10',
    dueDate: '2026-03-18',
    status: 'Open',
    associatedModule: 'Enrollment',
    actionButtons: ['Approve', 'Review'],
    relatedRecordHref: '/dashboard/billing-enrollment/enrollment-activity',
    auditHistory: [
      {
        id: 'task-401-a1',
        action: 'Task Created',
        actor: 'System',
        occurredAt: '2026-03-10T08:10:00Z'
      }
    ]
  },
  {
    id: 'task-402',
    taskType: 'Eligibility Error',
    taskDescription: 'Resolve invalid dependent eligibility flags.',
    priority: 'Critical',
    associatedEmployee: 'Daniel Nguyen',
    createdDate: '2026-03-12',
    dueDate: '2026-03-17',
    status: 'Open',
    associatedModule: 'Enrollment',
    actionButtons: ['Resolve', 'Review'],
    relatedRecordHref: '/dashboard/billing-enrollment/enrollment-activity',
    auditHistory: [
      {
        id: 'task-402-a1',
        action: 'Task Created',
        actor: 'Eligibility Engine',
        occurredAt: '2026-03-12T11:22:00Z'
      }
    ]
  },
  {
    id: 'task-403',
    taskType: 'Invoice Payment Due',
    taskDescription: 'Invoice payment due before billing lock date.',
    priority: 'High',
    associatedInvoice: 'INV-2026-03',
    createdDate: '2026-03-08',
    dueDate: '2026-03-30',
    status: 'In Progress',
    associatedModule: 'Billing',
    actionButtons: ['Pay', 'Review'],
    relatedRecordHref: '/dashboard/billing-enrollment/billing-overview',
    auditHistory: [
      {
        id: 'task-403-a1',
        action: 'Task Created',
        actor: 'Billing Scheduler',
        occurredAt: '2026-03-08T06:00:00Z'
      },
      {
        id: 'task-403-a2',
        action: 'Assigned',
        actor: 'Alana Ross',
        occurredAt: '2026-03-09T14:08:00Z'
      }
    ]
  },
  {
    id: 'task-404',
    taskType: 'Open Enrollment Deadline',
    taskDescription: 'Open enrollment window closes soon. Review outstanding employees.',
    priority: 'Medium',
    createdDate: '2026-03-05',
    dueDate: '2026-11-15',
    status: 'Open',
    associatedModule: 'Enrollment',
    actionButtons: ['Review', 'Notify'],
    relatedRecordHref: '/dashboard/billing-enrollment/open-enrollment',
    auditHistory: [
      {
        id: 'task-404-a1',
        action: 'Task Created',
        actor: 'System',
        occurredAt: '2026-03-05T09:40:00Z'
      }
    ]
  },
  {
    id: 'task-405',
    taskType: 'Compliance Notice Review',
    taskDescription: 'ACA notice requires acknowledgment and archival.',
    priority: 'Medium',
    createdDate: '2026-03-04',
    dueDate: '2026-03-21',
    status: 'Completed',
    associatedModule: 'Compliance',
    actionButtons: ['Review'],
    relatedRecordHref: '/dashboard/billing-enrollment/document-center',
    auditHistory: [
      {
        id: 'task-405-a1',
        action: 'Task Completed',
        actor: 'Nina Patel',
        occurredAt: '2026-03-07T13:02:00Z'
      }
    ]
  },
  {
    id: 'task-406',
    taskType: 'Document Verification',
    taskDescription: 'Uploaded dependent documents are pending verification.',
    priority: 'Low',
    associatedEmployee: 'Olivia Carter',
    createdDate: '2026-03-01',
    dueDate: '2026-03-12',
    status: 'Expired',
    associatedModule: 'Documents',
    actionButtons: ['Resolve'],
    relatedRecordHref: '/dashboard/billing-enrollment/document-center',
    auditHistory: [
      {
        id: 'task-406-a1',
        action: 'Task Expired',
        actor: 'System',
        occurredAt: '2026-03-12T23:59:00Z'
      }
    ]
  }
];

const seedNotifications: EmployerNotificationRecord[] = [
  {
    id: 'notif-701',
    notificationType: 'Enrollment',
    message: '3 enrollment requests require review.',
    createdDate: '2026-03-14',
    readStatus: 'Unread',
    priority: 'High'
  },
  {
    id: 'notif-702',
    notificationType: 'Billing',
    message: 'Invoice INV-2026-03 due on Mar 30, 2026.',
    createdDate: '2026-03-13',
    readStatus: 'Unread',
    priority: 'Critical'
  },
  {
    id: 'notif-703',
    notificationType: 'Compliance',
    message: 'Eligibility audit window closes in 5 days.',
    createdDate: '2026-03-12',
    readStatus: 'Read',
    priority: 'Medium'
  },
  {
    id: 'notif-704',
    notificationType: 'Documents',
    message: 'New billing statement is available to download.',
    createdDate: '2026-03-11',
    readStatus: 'Read',
    priority: 'Low'
  },
  {
    id: 'notif-705',
    notificationType: 'System',
    message: 'Connector sync completed with warnings.',
    createdDate: '2026-03-10',
    readStatus: 'Unread',
    priority: 'Medium'
  },
  {
    id: 'notif-706',
    notificationType: 'Enrollment',
    message: 'Open enrollment reminder notifications sent successfully.',
    createdDate: '2026-03-09',
    readStatus: 'Read',
    priority: 'Low'
  }
];

const defaultPreferences: EmployerNotificationPreferences = {
  portalNotifications: true,
  emailNotifications: true,
  smsNotifications: false,
  categories: {
    Enrollment: true,
    Billing: true,
    Compliance: true,
    Documents: true,
    System: true
  }
};

function cloneTask(task: EmployerTaskRecord): EmployerTaskRecord {
  return {
    ...task,
    auditHistory: task.auditHistory.map((item) => ({ ...item }))
  };
}

export function getEmployerTasksForTenant(tenantId: string): EmployerTaskRecord[] {
  return seedTasks.map((task) => ({
    ...cloneTask(task),
    id: `${tenantId}-${task.id}`
  }));
}

export function getEmployerTaskByIdForTenant(tenantId: string, taskId: string) {
  return getEmployerTasksForTenant(tenantId).find((task) => task.id === taskId) ?? null;
}

export function getTaskFilterOptions(tasks: EmployerTaskRecord[]) {
  return {
    taskTypes: Array.from(new Set(tasks.map((task) => task.taskType))).sort(),
    priorities: Array.from(new Set(tasks.map((task) => task.priority))).sort(),
    statuses: Array.from(new Set(tasks.map((task) => task.status))).sort(),
    modules: Array.from(new Set(tasks.map((task) => task.associatedModule))).sort()
  };
}

export function getEmployerNotificationsForTenant(tenantId: string): EmployerNotificationRecord[] {
  return seedNotifications.map((notification) => ({
    ...notification,
    id: `${tenantId}-${notification.id}`
  }));
}

export function getEmployerNotificationPreferencesForTenant(_tenantId: string) {
  return {
    ...defaultPreferences,
    categories: { ...defaultPreferences.categories }
  };
}

export function getNotificationsTaskSummaryForTenant(tenantId: string) {
  const tasks = getEmployerTasksForTenant(tenantId);
  const notifications = getEmployerNotificationsForTenant(tenantId);

  const openTasks = tasks.filter((task) => task.status === 'Open' || task.status === 'In Progress').length;
  const highPriorityAlerts = tasks.filter(
    (task) => task.status !== 'Completed' && (task.priority === 'High' || task.priority === 'Critical')
  ).length;

  const referenceDate = new Date('2026-03-16T00:00:00Z');
  const upcomingDeadlines = tasks.filter((task) => {
    if (task.status === 'Completed') {
      return false;
    }
    const due = new Date(`${task.dueDate}T00:00:00Z`);
    const diffDays = Math.ceil((due.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  }).length;

  const recentNotifications = notifications.length;

  const taskItems = [
    `Approve Pending Enrollments (${tasks.filter((task) => task.taskType === 'Pending Enrollment Approval' && task.status !== 'Completed').length})`,
    `Resolve Eligibility Errors (${tasks.filter((task) => task.taskType === 'Eligibility Error' && task.status !== 'Completed').length})`,
    'Invoice Payment Due Mar 30',
    'Open Enrollment Deadline Nov 15'
  ];

  return {
    openTasks,
    highPriorityAlerts,
    upcomingDeadlines,
    recentNotifications,
    taskItems
  };
}
