import type { PortalNavigationSection } from './navigation';
import type { PortalSessionUser } from './portal-session';

export type BrokerPageId =
  | 'dashboard'
  | 'book-of-business'
  | 'quotes'
  | 'renewals'
  | 'enrollments'
  | 'commissions'
  | 'documents'
  | 'tasks'
  | 'support';

type BrokerPageMeta = {
  href: string;
  label: string;
  title: string;
  eyebrow: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  emptyStateTitle: string;
  emptyStateDescription: string;
};

const BROKER_ADMIN_ROLE_SET = new Set([
  'broker_admin',
  'tenant_admin',
  'platform_admin',
  'platform-admin'
]);

const BROKER_READ_ONLY_ROLE_SET = new Set(['broker_readonly', 'broker_read_only']);

const BROKER_STAFF_ROLE_SET = new Set([
  'broker',
  'broker_staff',
  'account_executive'
]);

export const brokerPageMetaById: Record<BrokerPageId, BrokerPageMeta> = {
  dashboard: {
    href: '/broker',
    label: 'Dashboard',
    title: 'Broker command center',
    eyebrow: 'Broker E&B Portal',
    description:
      'Monitor your book of business, prioritize active renewal and enrollment work, and keep client groups moving without leaving the portal.',
    ctaLabel: 'Open book of business',
    ctaHref: '/broker/book-of-business',
    emptyStateTitle: 'Broker activity will appear here',
    emptyStateDescription:
      'Assigned groups, work queues, and outreach items populate once broker feeds are connected for this agency.'
  },
  'book-of-business': {
    href: '/broker/book-of-business',
    label: 'Book of Business',
    title: 'Book of business',
    eyebrow: 'Broker E&B Portal',
    description:
      'Track assigned groups, census readiness, renewal posture, and client health across your current portfolio.',
    ctaLabel: 'Review renewal groups',
    ctaHref: '/broker/renewals',
    emptyStateTitle: 'No assigned groups loaded',
    emptyStateDescription:
      'Broker-facing group assignments will surface here once agency book-of-business data is available.'
  },
  quotes: {
    href: '/broker/quotes',
    label: 'Quotes',
    title: 'Quotes',
    eyebrow: 'Broker E&B Portal',
    description:
      'Manage open quote activity, carrier follow-up, and proposal readiness across prospects and existing clients.',
    ctaLabel: 'View active tasks',
    ctaHref: '/broker/tasks',
    emptyStateTitle: 'No open quotes in this workspace',
    emptyStateDescription:
      'Quote requests, underwriting dependencies, and proposal milestones will appear here when quote workflows are enabled.'
  },
  renewals: {
    href: '/broker/renewals',
    label: 'Renewals',
    title: 'Renewals',
    eyebrow: 'Broker E&B Portal',
    description:
      'Prioritize groups in renewal, identify missing census or contribution decisions, and keep carrier submissions on track.',
    ctaLabel: 'Open documents',
    ctaHref: '/broker/documents',
    emptyStateTitle: 'No renewals queued yet',
    emptyStateDescription:
      'Renewal strategy, rates, and readiness milestones will appear here as broker renewal workflows expand.'
  },
  enrollments: {
    href: '/broker/enrollments',
    label: 'Enrollments',
    title: 'Enrollments',
    eyebrow: 'Broker E&B Portal',
    description:
      'Watch enrollment progress across groups, surface blockers, and hand off cases before coverage effective dates are at risk.',
    ctaLabel: 'Review book of business',
    ctaHref: '/broker/book-of-business',
    emptyStateTitle: 'No enrollments in progress',
    emptyStateDescription:
      'Broker enrollment oversight items will show here when groups have active implementation or renewal activity.'
  },
  commissions: {
    href: '/broker/commissions',
    label: 'Commissions',
    title: 'Commissions',
    eyebrow: 'Broker E&B Portal',
    description:
      'Review commission exceptions, pending statements, and reconciliation items across your agency hierarchy.',
    ctaLabel: 'Open support resources',
    ctaHref: '/broker/support',
    emptyStateTitle: 'No commission exceptions to review',
    emptyStateDescription:
      'Commission statements and exception workflows will appear here once downstream feeds are connected.'
  },
  documents: {
    href: '/broker/documents',
    label: 'Documents',
    title: 'Documents',
    eyebrow: 'Broker E&B Portal',
    description:
      'Organize census files, renewal packets, applications, and implementation documents across client groups.',
    ctaLabel: 'Review enrollment work',
    ctaHref: '/broker/enrollments',
    emptyStateTitle: 'No broker documents loaded',
    emptyStateDescription:
      'Missing census files, signed paperwork, and document requests will surface here for assigned accounts.'
  },
  tasks: {
    href: '/broker/tasks',
    label: 'Tasks / Cases',
    title: 'Tasks and cases',
    eyebrow: 'Broker E&B Portal',
    description:
      'Work broker follow-up items, carrier cases, and client escalations from one operational queue.',
    ctaLabel: 'Go to support and training',
    ctaHref: '/broker/support',
    emptyStateTitle: 'No tasks assigned right now',
    emptyStateDescription:
      'Broker work queues, service cases, and escalation handling will appear here once case feeds are enabled.'
  },
  support: {
    href: '/broker/support',
    label: 'Support / Training',
    title: 'Support and training',
    eyebrow: 'Broker E&B Portal',
    description:
      'Access broker support contacts, training guides, and implementation references without leaving the E&B workspace.',
    ctaLabel: 'Return to dashboard',
    ctaHref: '/broker',
    emptyStateTitle: 'No broker resources assigned',
    emptyStateDescription:
      'Training playlists, support contacts, and release guidance will appear here when broker enablement content is published.'
  }
};

export function resolveBrokerPersona(user: Pick<PortalSessionUser, 'roles'>) {
  if (user.roles.some((role) => BROKER_READ_ONLY_ROLE_SET.has(role))) {
    return {
      label: 'Read-only broker',
      dashboardCtaLabel: 'View assigned groups',
      canManage: false
    };
  }

  if (user.roles.some((role) => BROKER_ADMIN_ROLE_SET.has(role))) {
    return {
      label: 'Broker admin',
      dashboardCtaLabel: 'Review high-priority renewals',
      canManage: true
    };
  }

  if (user.roles.some((role) => BROKER_STAFF_ROLE_SET.has(role))) {
    return {
      label: 'Broker staff',
      dashboardCtaLabel: 'Open work queue',
      canManage: true
    };
  }

  return {
    label: 'Broker user',
    dashboardCtaLabel: 'Open broker dashboard',
    canManage: true
  };
}

export function getBrokerNavigationSections(): PortalNavigationSection[] {
  return [
    {
      title: 'Broker E&B Portal',
      items: [
        {
          label: brokerPageMetaById.dashboard.label,
          href: brokerPageMetaById.dashboard.href,
          description: 'Broker command center across groups, prospects, and service activity.'
        },
        {
          label: brokerPageMetaById['book-of-business'].label,
          href: brokerPageMetaById['book-of-business'].href,
          description: 'Monitor assigned groups, census readiness, and portfolio health.'
        },
        {
          label: brokerPageMetaById.quotes.label,
          href: brokerPageMetaById.quotes.href,
          description: 'Track quote intake, underwriting dependencies, and proposal timing.'
        },
        {
          label: brokerPageMetaById.renewals.label,
          href: brokerPageMetaById.renewals.href,
          description: 'Manage renewal timelines, missing items, and client decision points.'
        },
        {
          label: brokerPageMetaById.enrollments.label,
          href: brokerPageMetaById.enrollments.href,
          description: 'Follow enrollment readiness and implementation activity across groups.'
        },
        {
          label: brokerPageMetaById.commissions.label,
          href: brokerPageMetaById.commissions.href,
          description: 'Review statements, exceptions, and reconciliation follow-up.'
        },
        {
          label: brokerPageMetaById.documents.label,
          href: brokerPageMetaById.documents.href,
          description: 'Organize census, renewal, and client-submitted documentation.'
        },
        {
          label: brokerPageMetaById.tasks.label,
          href: brokerPageMetaById.tasks.href,
          description: 'Work open cases, service items, and escalations from one queue.'
        },
        {
          label: brokerPageMetaById.support.label,
          href: brokerPageMetaById.support.href,
          description: 'Access broker support channels, training, and release guidance.'
        }
      ]
    }
  ];
}

export function getBrokerPageMeta(pageId: BrokerPageId) {
  return brokerPageMetaById[pageId];
}
