import { PlatformAdminGate } from '../../../components/platform-admin-gate';
import { PlatformAuditLog } from './platform-audit-log';

export default function PlatformAuditPage() {
  return (
    <PlatformAdminGate>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-admin-accent">
            Platform
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-admin-text">
            System audit
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-admin-muted">
            Review audit activity across the full platform without switching tenant
            scope.
          </p>
        </div>

        <PlatformAuditLog />
      </div>
    </PlatformAdminGate>
  );
}
