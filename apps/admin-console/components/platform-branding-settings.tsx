'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { config } from '../lib/public-runtime';
import { getAdminAuthHeaders } from '../lib/api-auth';
import { SectionCard } from './section-card';

type PlatformBrandingState = {
  hasCustomCss: boolean;
  cssUrl: string;
  publicStorageUrl: string | null;
  sizeBytes: number;
};

const emptyState: PlatformBrandingState = {
  hasCustomCss: false,
  cssUrl: `${config.serviceEndpoints.api}/public/platform-branding/custom.css`,
  publicStorageUrl: null,
  sizeBytes: 0
};

export function PlatformBrandingSettings() {
  const [state, setState] = useState<PlatformBrandingState>(emptyState);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const cssPreviewUrl = useMemo(
    () => `${config.serviceEndpoints.api}${state.cssUrl}`,
    [state.cssUrl]
  );

  const loadState = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch(
        `${config.apiBaseUrl}/platform-admin/settings/branding`,
        {
          headers: getAdminAuthHeaders()
        }
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(payload?.message ?? 'Unable to load platform branding settings.');
      }

      const payload = (await response.json()) as PlatformBrandingState;
      setState({
        ...payload,
        cssUrl: payload.cssUrl || emptyState.cssUrl
      });
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : 'Unable to load platform branding settings.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadState();
  }, [loadState]);

  async function handleUpload() {
    if (!selectedFile) {
      setError('Choose a CSS file before uploading.');
      return;
    }

    setError('');
    setSuccess('');
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(
        `${config.apiBaseUrl}/platform-admin/settings/branding/css`,
        {
          method: 'POST',
          headers: getAdminAuthHeaders(),
          body: formData
        }
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(payload?.message ?? 'Unable to upload platform branding CSS.');
      }

      setSelectedFile(null);
      setSuccess('Platform branding CSS uploaded.');
      await loadState();
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : 'Unable to upload platform branding CSS.'
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function handleRemove() {
    setError('');
    setSuccess('');
    setIsRemoving(true);

    try {
      const response = await fetch(
        `${config.apiBaseUrl}/platform-admin/settings/branding/css`,
        {
          method: 'DELETE',
          headers: getAdminAuthHeaders()
        }
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(payload?.message ?? 'Unable to remove platform branding CSS.');
      }

      setSuccess('Platform branding CSS removed.');
      await loadState();
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : 'Unable to remove platform branding CSS.'
      );
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <SectionCard
      title="Platform styling override"
      description="Upload a CSS file to restyle platform-only pages like the control center and login/entry screens without touching tenant experiences."
    >
      <div className="space-y-4">
        <div className="admin-panel-muted space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-admin-text">Current override</p>
              <p className="mt-1 text-sm text-admin-muted">
                {isLoading
                  ? 'Loading platform CSS status...'
                  : state.hasCustomCss
                  ? `Custom CSS is active (${state.sizeBytes.toLocaleString()} bytes).`
                  : 'No uploaded platform CSS. The built-in platform theme is active.'}
              </p>
            </div>
            <span
              className={`admin-badge ${state.hasCustomCss ? 'admin-badge--success' : 'admin-badge--neutral'}`}
            >
              {state.hasCustomCss ? 'Active' : 'Default'}
            </span>
          </div>

          <div className="space-y-1 text-sm text-admin-muted">
            <p>
              Runtime CSS URL:{' '}
              <a href={cssPreviewUrl} target="_blank" rel="noreferrer" className="text-admin-accent underline-offset-4 hover:underline">
                {cssPreviewUrl}
              </a>
            </p>
            <p>Only platform-level pages load this file. Tenant experiences do not.</p>
          </div>
        </div>

        <div className="admin-panel-muted space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-admin-text">Upload CSS file</span>
            <input
              type="file"
              accept=".css,text/css"
              className="mt-2 block w-full text-sm text-admin-muted file:admin-button file:admin-button--secondary file:mr-3 file:border-0"
              onChange={(event) => {
                setSelectedFile(event.target.files?.[0] ?? null);
              }}
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="admin-button admin-button--primary"
              disabled={!selectedFile || isUploading}
              onClick={() => void handleUpload()}
            >
              {isUploading ? 'Uploading CSS...' : 'Upload CSS'}
            </button>

            <button
              type="button"
              className="admin-button admin-button--secondary"
              disabled={!state.hasCustomCss || isRemoving}
              onClick={() => void handleRemove()}
            >
              {isRemoving ? 'Removing override...' : 'Remove override'}
            </button>
          </div>

          {selectedFile ? (
            <p className="text-sm text-admin-muted">
              Ready to upload: <span className="font-semibold text-admin-text">{selectedFile.name}</span>
            </p>
          ) : null}
        </div>

        {error ? <p className="admin-notice admin-notice--danger">{error}</p> : null}
        {success ? <p className="admin-notice admin-notice--success">{success}</p> : null}
      </div>
    </SectionCard>
  );
}
