import type {
  ProviderOperationsDashboardContract,
  ProviderOperationsWidgetContract
} from '@payer-portal/api-contracts';

export const PROVIDER_OPERATIONS_STREAM_STALE_AFTER_MS = 45_000;
export const PROVIDER_OPERATIONS_POLL_INTERVAL_MS = 30_000;

export function mergeProviderOperationsDashboard(
  previous: ProviderOperationsDashboardContract,
  incoming: ProviderOperationsDashboardContract
) {
  const previousWidgets = new Map(
    previous.widgets.map((widget) => [widget.id, widget] as const)
  );

  const widgets = incoming.widgets.map((widget) => {
    const prior = previousWidgets.get(widget.id);

    if (!prior) {
      return widget;
    }

    const changed =
      prior.summary !== widget.summary ||
      prior.detail !== widget.detail ||
      prior.tone !== widget.tone ||
      prior.scope.mode !== widget.scope.mode ||
      prior.scope.activeOrganizationUnitId !== widget.scope.activeOrganizationUnitId ||
      prior.scope.rollupAuthorized !== widget.scope.rollupAuthorized ||
      prior.highlights.join('|') !== widget.highlights.join('|') ||
      prior.sourceTypes.join('|') !== widget.sourceTypes.join('|');

    return changed ? widget : prior;
  });

  return {
    ...incoming,
    widgets
  } satisfies ProviderOperationsDashboardContract;
}

export function shouldUseProviderOperationsPollingFallback(input: {
  lastStreamMessageAt: number | null;
  now: number;
  streamSupported: boolean;
  streamState: 'connecting' | 'open' | 'degraded';
}) {
  if (!input.streamSupported) {
    return true;
  }

  if (input.streamState === 'degraded') {
    return true;
  }

  if (
    input.lastStreamMessageAt !== null &&
    input.now - input.lastStreamMessageAt > PROVIDER_OPERATIONS_STREAM_STALE_AFTER_MS
  ) {
    return true;
  }

  return false;
}

export function widgetsChanged(
  previous: ProviderOperationsWidgetContract[],
  next: ProviderOperationsWidgetContract[]
) {
  if (previous.length !== next.length) {
    return true;
  }

  return next.some((widget, index) => {
    const prior = previous[index];

    if (!prior) {
      return true;
    }

    return (
      prior.id !== widget.id ||
      prior.summary !== widget.summary ||
      prior.detail !== widget.detail ||
      prior.tone !== widget.tone ||
      prior.scope.mode !== widget.scope.mode ||
      prior.scope.activeOrganizationUnitId !== widget.scope.activeOrganizationUnitId ||
      prior.sourceTypes.join('|') !== widget.sourceTypes.join('|')
    );
  });
}
