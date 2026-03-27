import { AdminPlaceholderPage } from '../../../../components/admin-placeholder-page';
import { PlatformAdminGate } from '../../../../components/platform-admin-gate';

export default function AdminDeveloperDebugPage() {
  return (
    <PlatformAdminGate>
      <AdminPlaceholderPage
        eyebrow="Developer Mode"
        title="Debug Tools"
        description="Operator and developer debug tools belong here behind the Developer Mode toggle so the primary control plane stays clean."
        highlights={[
          'Reserved for traces, jobs, queue inspection, and adapter debugging.',
          'Kept out of tenant-scoped navigation unless intentionally scoped.',
          'The page exists in the canonical route tree now.'
        ]}
        nextSteps={[
          'Add trace lookup and job replay tools.',
          'Expose queue lag and worker diagnostics.',
          'Connect debug actions to audit logging.'
        ]}
      />
    </PlatformAdminGate>
  );
}
