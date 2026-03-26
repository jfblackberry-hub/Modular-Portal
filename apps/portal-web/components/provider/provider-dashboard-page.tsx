import {
  type ProviderPortalConfig
} from '../../config/providerPortalConfig';
import type { ProviderOperationsDashboardContract } from '@payer-portal/api-contracts';
import type { PortalSessionUser } from '../../lib/portal-session';
import { ProviderOperationsDashboard } from './operations/provider-operations-widget-registry';

export function ProviderDashboardPage({
  clinicLogoSrc,
  clinicName,
  config,
  dashboard,
  imageSrc,
  providerName,
  user
}: {
  clinicLogoSrc: string;
  clinicName: string;
  config: ProviderPortalConfig;
  dashboard: ProviderOperationsDashboardContract;
  imageSrc: string;
  providerName: string;
  user: PortalSessionUser;
}) {
  return (
    <ProviderOperationsDashboard
      clinicLogoSrc={clinicLogoSrc}
      clinicName={clinicName}
      config={config}
      dashboard={dashboard}
      imageSrc={imageSrc}
      providerName={providerName}
      user={user}
    />
  );
}
