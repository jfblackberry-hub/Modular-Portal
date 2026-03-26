'use client';

import { startTransition, useEffect, useRef, useState } from 'react';
import type {
  ProviderWorkflowActionRequest,
  ProviderWorkflowExecutionContract
} from '@payer-portal/api-contracts';

const TERMINAL_STATUSES = new Set(['SUCCEEDED', 'FAILED', 'CANCELLED']);

function isWorkflowExecutionContract(
  value: ProviderWorkflowExecutionContract | { message?: string }
): value is ProviderWorkflowExecutionContract {
  return 'id' in value && typeof value.id === 'string';
}

function getWorkflowErrorMessage(
  value: ProviderWorkflowExecutionContract | { message?: string }
) {
  return !isWorkflowExecutionContract(value) && typeof value.message === 'string'
    ? value.message
    : 'Unable to submit provider workflow action.';
}

function getStatusMessage(workflow: ProviderWorkflowExecutionContract | null) {
  if (!workflow) {
    return null;
  }

  if (workflow.status === 'SUCCEEDED') {
    return typeof workflow.resultPayload?.summary === 'string'
      ? workflow.resultPayload.summary
      : 'Action accepted and completed.';
  }

  if (workflow.status === 'FAILED') {
    return 'Workflow execution failed. Review the audit trail and retry if appropriate.';
  }

  return `Workflow ${workflow.id.slice(0, 8)} is ${workflow.status.toLowerCase()}.`;
}

export function ProviderWorkflowActionButton({
  label,
  request,
  tone = 'secondary'
}: {
  label: string;
  request: ProviderWorkflowActionRequest;
  tone?: 'primary' | 'secondary';
}) {
  const [workflow, setWorkflow] = useState<ProviderWorkflowExecutionContract | null>(null);
  const [state, setState] = useState<'idle' | 'submitting' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, []);

  async function refreshWorkflow(workflowId: string) {
    const response = await fetch(
      `/api/provider-operations/workflows/${encodeURIComponent(workflowId)}`,
      {
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      throw new Error('Unable to refresh workflow status.');
    }

    return (await response.json()) as ProviderWorkflowExecutionContract;
  }

  async function handleClick() {
    setState('submitting');
    setErrorMessage(null);

    try {
      const response = await fetch('/api/provider-operations/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });
      const payload = (await response.json()) as
        | ProviderWorkflowExecutionContract
        | { message?: string };

      if (!response.ok || !isWorkflowExecutionContract(payload)) {
        throw new Error(getWorkflowErrorMessage(payload));
      }

      startTransition(() => {
        setWorkflow(payload);
        setState('idle');
      });

      if (TERMINAL_STATUSES.has(payload.status)) {
        return;
      }

      let attemptsRemaining = 6;
      pollTimerRef.current = setInterval(async () => {
        if (attemptsRemaining <= 0) {
          if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
          }
          return;
        }

        attemptsRemaining -= 1;

        try {
          const nextWorkflow = await refreshWorkflow(payload.id);
          startTransition(() => {
            setWorkflow(nextWorkflow);
          });

          if (TERMINAL_STATUSES.has(nextWorkflow.status) && pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
          }
        } catch {
          if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
          }
        }
      }, 1_000);
    } catch (error) {
      setState('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to submit provider workflow action.'
      );
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => {
          void handleClick();
        }}
        disabled={state === 'submitting'}
        className={`inline-flex min-h-10 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition ${
          tone === 'primary'
            ? 'bg-[var(--tenant-primary-color)] text-white disabled:opacity-70'
            : 'border border-[var(--tenant-primary-color)] text-[var(--tenant-primary-color)] disabled:opacity-70'
        }`}
      >
        {state === 'submitting' ? 'Submitting...' : label}
      </button>
      {errorMessage ? (
        <p className="text-xs text-rose-700">{errorMessage}</p>
      ) : null}
      {!errorMessage && workflow ? (
        <p className="max-w-xs text-xs text-[var(--text-secondary)]">
          {getStatusMessage(workflow)}
        </p>
      ) : null}
    </div>
  );
}
