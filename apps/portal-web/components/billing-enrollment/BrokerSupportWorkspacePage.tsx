'use client';

import type { BrokerAlert } from '../../lib/broker-portfolio-data';
import { InlineButton, PageHeader, SupportLink, SurfaceCard } from '../portal-ui';

export function BrokerSupportWorkspacePage({
  resources
}: {
  resources: Array<{ id: string; title: string; description: string; href: string }>;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Broker E&B Portal"
        title="Support and training"
        description="Broker support resources, workflow guides, and enablement links that help teams move quotes, renewals, commissions, and service work forward."
        actions={<InlineButton href="/broker/tasks" tone="secondary">Open work queue</InlineButton>}
      />
      <SurfaceCard title="Broker resources" description="Operational references and jump points for the most common broker tasks.">
        <div className="grid gap-3 md:grid-cols-2">
          {resources.map((item) => (
            <SupportLink key={item.id} href={item.href} label={item.title} description={item.description} />
          ))}
        </div>
      </SurfaceCard>
    </div>
  );
}
