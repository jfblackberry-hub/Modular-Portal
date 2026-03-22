function TenantAdminPageFrame({
  eyebrow,
  title,
  description,
  cards
}: {
  eyebrow: string;
  title: string;
  description: string;
  cards: Array<{ title: string; value: string; detail: string }>;
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
          {eyebrow}
        </p>
        <h2 className="mt-4 text-5xl font-semibold tracking-[-0.05em] text-slate-950">
          {title}
        </h2>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
          {description}
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <article key={card.title} className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              {card.title}
            </p>
            <p className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
              {card.value}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {card.detail}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}

export function TenantAdminDashboardView() {
  return (
    <TenantAdminPageFrame
      eyebrow="Tenant Operations"
      title="Dashboard"
      description="Monitor tenant readiness, active operator work, and cross-workspace health from a dedicated tenant-admin control plane."
      cards={[
        { title: 'Open actions', value: '12', detail: 'Pending issues requiring operator review today.' },
        { title: 'Healthy modules', value: '9/10', detail: 'Enabled modules currently passing readiness checks.' },
        { title: 'Audit alerts', value: '3', detail: 'Notable tenant-scoped events flagged for follow-up.' }
      ]}
    />
  );
}

export function TenantAdminConfigurationView() {
  return (
    <TenantAdminPageFrame
      eyebrow="Tenant Setup"
      title="Configuration"
      description="Manage tenant-scoped branding, notifications, defaults, and operational configuration without entering employer or end-user surfaces."
      cards={[
        { title: 'Branding', value: 'Ready', detail: 'Primary logos, colors, and tenant display copy are configured.' },
        { title: 'Notifications', value: '6 rules', detail: 'Delivery rules and escalation preferences are active.' },
        { title: 'Module defaults', value: '14', detail: 'Tenant-level defaults currently applied across enabled modules.' }
      ]}
    />
  );
}

export function TenantAdminUsersView() {
  return (
    <TenantAdminPageFrame
      eyebrow="Identity"
      title="Users"
      description="Create, review, and manage tenant-scoped user access with clear separation from platform and end-user workspaces."
      cards={[
        { title: 'Active users', value: '148', detail: 'Users currently enabled inside this tenant scope.' },
        { title: 'Pending invites', value: '7', detail: 'Invitations awaiting acceptance or provisioning.' },
        { title: 'Access reviews', value: '2 due', detail: 'Scheduled access certifications currently outstanding.' }
      ]}
    />
  );
}

export function TenantAdminRolesView() {
  return (
    <TenantAdminPageFrame
      eyebrow="Governance"
      title="Roles"
      description="Review tenant role boundaries, permission coverage, and delegated operator capabilities within this tenant-admin namespace."
      cards={[
        { title: 'Role sets', value: '8', detail: 'Tenant-scoped role definitions available to operators.' },
        { title: 'Exceptions', value: '1', detail: 'One permission override currently requires review.' },
        { title: 'Pending changes', value: '4', detail: 'Queued adjustments awaiting approval or publication.' }
      ]}
    />
  );
}

export function TenantAdminSubtenantsView() {
  return (
    <TenantAdminPageFrame
      eyebrow="Hierarchy"
      title="Subtenants"
      description="Manage delegated access and operating boundaries for sub-tenant structures without exposing neighboring tenant data."
      cards={[
        { title: 'Subtenants', value: '5', detail: 'Organizational subdivisions currently recognized under this tenant.' },
        { title: 'Delegated admins', value: '11', detail: 'Scoped administrators assigned to sub-tenant workloads.' },
        { title: 'Pending mappings', value: '2', detail: 'Relationship updates waiting for confirmation.' }
      ]}
    />
  );
}

export function TenantAdminIntegrationsView() {
  return (
    <TenantAdminPageFrame
      eyebrow="Connectivity"
      title="Integrations"
      description="Inspect tenant-specific connectors, external dependencies, and sync health from a dedicated operator workspace."
      cards={[
        { title: 'Connected systems', value: '6', detail: 'Tenant integrations currently configured and reachable.' },
        { title: 'Warnings', value: '2', detail: 'Two connectors need attention before the next sync window.' },
        { title: 'Last successful sync', value: '18m', detail: 'Most recent successful tenant-wide connector activity.' }
      ]}
    />
  );
}

export function TenantAdminAuditView() {
  return (
    <TenantAdminPageFrame
      eyebrow="Audit"
      title="Audit"
      description="Review tenant-scoped changes, operator activity, and security-relevant events in a dedicated audit workspace."
      cards={[
        { title: 'Events today', value: '284', detail: 'Tenant-scoped audit entries captured in the current day.' },
        { title: 'Policy alerts', value: '3', detail: 'Governance or access events needing acknowledgment.' },
        { title: 'Exports', value: '1 queued', detail: 'One audit extract currently being prepared for download.' }
      ]}
    />
  );
}
