import type { ProviderPortalConfig } from '../../../config/providerPortalConfig';
import { PortalHeroBanner } from '../../shared/portal-hero-banner';
import { AuthorizationQueue } from './AuthorizationQueue';
import { ClaimsFollowUpQueue } from './ClaimsFollowUpQueue';
import { ProviderAlertsList } from './ProviderAlertsList';
import { ProviderContextBar } from './ProviderContextBar';
import { ProviderMetricsRow } from './ProviderMetricsRow';
import { ProviderQuickActions } from './ProviderQuickActions';
import { ProviderResourcesRow } from './ProviderResourcesRow';

function getQuickActionHref(config: ProviderPortalConfig, label: string, fallback: string) {
  const action = config.quickActions.find((item) => item.label.toLowerCase() === label.toLowerCase());
  return action?.href ?? fallback;
}

export function MedicalProviderDashboard({
  config,
  imageSrc
}: {
  config: ProviderPortalConfig;
  imageSrc: string;
}) {
  const quickActions = [
    {
      label: 'Verify Eligibility',
      href: getQuickActionHref(config, 'Start eligibility check', '/provider/eligibility')
    },
    {
      label: 'Submit Authorization',
      href: getQuickActionHref(config, 'Create authorization', '/provider/authorizations')
    },
    {
      label: 'Check Claim Status',
      href: getQuickActionHref(config, 'Check claim status', '/provider/claims')
    },
    {
      label: 'View Payments',
      href: getQuickActionHref(config, 'View remits', '/provider/payments')
    }
  ];

  const metrics = [
    {
      label: 'Eligibility Checks Today',
      value: '42',
      trend: '+8% vs yesterday'
    },
    {
      label: 'Pending Authorizations',
      value: '11',
      trend: '+2 new requests'
    },
    {
      label: 'Claims Requiring Follow-Up',
      value: '19',
      trend: '5 due today'
    },
    {
      label: 'Payments Posted Today',
      value: '8',
      trend: '$84,220 total'
    }
  ];

  const authorizationsQueue = [
    {
      authId: 'PA-100233',
      patientName: 'Jordan Patel',
      date: '2026-03-14',
      status: 'Needs Info',
      nextAction: 'Upload additional clinical notes'
    },
    {
      authId: 'PA-100245',
      patientName: 'Taylor Morgan',
      date: '2026-03-14',
      status: 'Pending',
      nextAction: 'Monitor payer review'
    },
    {
      authId: 'PA-100251',
      patientName: 'Avery Brooks',
      date: '2026-03-13',
      status: 'Approved',
      nextAction: 'Schedule approved service'
    },
    {
      authId: 'PA-100259',
      patientName: 'Cameron Diaz',
      date: '2026-03-13',
      status: 'Denied',
      nextAction: 'Review denial and prepare appeal'
    }
  ];

  const claimsQueue = [
    {
      claimId: 'CLM-100245',
      patientName: 'Taylor Morgan',
      date: '2026-03-05',
      status: 'Follow Up Required',
      nextAction: 'Validate posted adjustment codes'
    },
    {
      claimId: 'CLM-100233',
      patientName: 'Jordan Patel',
      date: '2026-03-02',
      status: 'Needs Info',
      nextAction: 'Submit requested documentation'
    },
    {
      claimId: 'CLM-100217',
      patientName: 'Avery Brooks',
      date: '2026-02-28',
      status: 'Pending',
      nextAction: 'Check adjudication timeline tomorrow'
    },
    {
      claimId: 'CLM-100266',
      patientName: 'Morgan Reed',
      date: '2026-02-26',
      status: 'Denied',
      nextAction: 'Review denial and start appeal'
    }
  ];

  const alerts = [
    {
      id: 'alert-auth',
      type: 'warning' as const,
      message: '3 prior authorization cases require clinical attachments before 3:00 PM.',
      status: 'Action Required',
      date: '2026-03-14'
    },
    {
      id: 'alert-claims',
      type: 'info' as const,
      message: 'Claims follow-up queue includes 5 records approaching timely filing thresholds.',
      status: 'Review',
      date: '2026-03-14'
    },
    {
      id: 'alert-payments',
      type: 'success' as const,
      message: 'ERA files for this morning batch are now available for download.',
      status: 'Posted',
      date: '2026-03-14'
    }
  ];

  const notices = [
    {
      id: 'notice-maint-1',
      title: 'Maintenance',
      message: 'Claims and payments services maintenance scheduled Sunday, 2:00 AM - 4:00 AM ET.',
      date: '2026-03-14'
    },
    {
      id: 'notice-maint-2',
      title: 'System Notice',
      message: 'Eligibility response times may be delayed during nightly enrollment sync between 10:00 PM - 11:00 PM ET.',
      date: '2026-03-14'
    }
  ];

  const resources = [
    {
      label: 'Provider Manual',
      href: '/provider/documents',
      description: 'Coverage and operations policies'
    },
    {
      label: 'Forms Library',
      href: '/provider/documents',
      description: 'Common clinical and billing forms'
    },
    {
      label: 'Training',
      href: '/provider/support',
      description: 'Portal and workflow training guides'
    },
    {
      label: 'Contact Support',
      href: '/provider/support',
      description: 'Escalation channels and support options'
    }
  ];

  return (
    <div className="mx-auto w-full max-w-[1080px] space-y-3 pb-2">
      <PortalHeroBanner
        eyebrow={config.displayName}
        title="Provider operations dashboard"
        description="Verify eligibility, track authorizations and claims, and keep operational queues moving in one workspace."
        imageSrc={imageSrc}
        imageDecorative
        priority
      />
      <ProviderContextBar config={config} />
      <ProviderQuickActions actions={quickActions} />
      <ProviderMetricsRow metrics={metrics} />

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-3">
          <AuthorizationQueue items={authorizationsQueue} />
          <ClaimsFollowUpQueue items={claimsQueue} />
        </div>
        <ProviderAlertsList alerts={alerts} notices={notices} />
      </section>

      <ProviderResourcesRow resources={resources} />
    </div>
  );
}
