export type PortalActionWorkspaceBlueprint = {
  key: string;
  label: string;
  description: string;
};

export const portalActionWorkspaceBlueprints = {
  provider: [
    {
      key: 'eligibility',
      label: 'Verify Eligibility',
      description: 'Launch member eligibility and benefits checks without leaving the dashboard.'
    },
    {
      key: 'authorizations',
      label: 'Submit Authorization',
      description: 'Open the authorization workspace only when prior auth work is needed.'
    },
    {
      key: 'claims',
      label: 'Check Claim Status',
      description: 'Load claim search and follow-up tools on demand.'
    },
    {
      key: 'payments',
      label: 'View Payments',
      description: 'Hydrate remittance and payment operations only when selected.'
    }
  ],
  member: [
    { key: 'find-care', label: 'Find Care', description: 'Load provider and care search tools on demand.' },
    { key: 'id-card', label: 'View ID Card', description: 'Surface digital ID card tools on demand.' },
    { key: 'claims', label: 'Claims', description: 'Review claims without leaving the dashboard.' },
    { key: 'benefits', label: 'Benefits', description: 'Open the benefits workspace in-page.' },
    {
      key: 'care-cost-estimator',
      label: 'Cost Estimator',
      description: 'Launch cost shopping and comparison tools in the current page.'
    },
    {
      key: 'authorizations',
      label: 'Authorizations / Referrals',
      description: 'Open authorization and referral status tools without leaving the dashboard.'
    }
  ],
  brokerEmployer: [
    {
      key: 'book-of-business',
      label: 'Book of Business',
      description: 'Load the broker portfolio workspace below the dashboard action row.'
    },
    { key: 'renewals', label: 'Renewals', description: 'Open renewals by timing window and next action.' },
    { key: 'quotes', label: 'Quotes', description: 'Hydrate the quoting workspace only when selected.' },
    {
      key: 'commissions',
      label: 'Commissions',
      description: 'Show broker compensation summaries and exceptions on demand.'
    }
  ],
  brokerIndividual: [
    { key: 'prospects', label: 'Prospects', description: 'Open the prospect workspace below the hero.' },
    {
      key: 'applications',
      label: 'Applications',
      description: 'Load individual application operations lazily.'
    },
    { key: 'enrollments', label: 'Enrollments', description: 'Hydrate enrollment workspaces on click.' },
    { key: 'plans', label: 'Plans', description: 'Review product and plan tools without a full route change.' }
  ],
  employer: [
    {
      key: 'group-dashboard',
      label: 'Group Dashboard',
      description: 'Open employee census and group coverage operations without leaving the dashboard.'
    },
    {
      key: 'renewals',
      label: 'Renewals',
      description: 'Load renewal and open enrollment progress only when needed.'
    },
    {
      key: 'census-support',
      label: 'Census / Enrollment Support',
      description: 'Hydrate census corrections and enrollment support workflows on demand.'
    },
    {
      key: 'billing-payments',
      label: 'Billing / Payments',
      description: 'Open billing and payment operations in-page.'
    },
    {
      key: 'cases-issues',
      label: 'Cases / Issues',
      description: 'Review service follow-up and support case status without a route change.'
    },
    {
      key: 'documents-reports',
      label: 'Documents / Reports',
      description: 'Load document center and reporting tools only when selected.'
    }
  ]
} satisfies Record<string, PortalActionWorkspaceBlueprint[]>;
