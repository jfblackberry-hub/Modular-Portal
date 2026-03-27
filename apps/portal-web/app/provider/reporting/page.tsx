import { ProviderReportingWorkspace } from '../../../components/provider/operations/provider-reporting-workspace';
import { resolveProviderClinicName } from '../../../lib/provider-hero-branding';
import { getProviderOperationsDashboardSnapshot } from '../../../lib/provider-operations-snapshot';
import { createDefaultProviderReportingFilters } from '../../../lib/provider-reporting';
import {
  getProviderReportingStaticOptionsFromWarehouse,
  getProviderReportingWarehouseSummary,
  runProviderReport
} from '../../../lib/provider-reporting-service';

export default async function ProviderReportingRoutePage() {
  const { config, user } = await getProviderOperationsDashboardSnapshot();
  const clinicName = resolveProviderClinicName({
    tenantBrandingConfig: user.tenant.brandingConfig,
    practiceName: config.providerContext.practiceName
  });
  const initialFilters = createDefaultProviderReportingFilters();

  return (
    <ProviderReportingWorkspace
      clinicName={clinicName}
      initialFilters={initialFilters}
      initialPayload={{
        options: getProviderReportingStaticOptionsFromWarehouse(),
        report: runProviderReport(initialFilters),
        summary: getProviderReportingWarehouseSummary()
      }}
    />
  );
}
