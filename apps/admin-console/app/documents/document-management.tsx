'use client';

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';

import { SectionCard } from '../../components/section-card';
import { apiBaseUrl, getAdminAuthHeaders } from '../../lib/api-auth';

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

type TenantAdminUsersPayload = {
  tenant: {
    id: string;
    name: string;
  };
  users: User[];
};

type DocumentRecord = {
  id: string;
  filename: string;
  sizeBytes: number;
  mimeType: string;
  createdAt: string;
};

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatUploadDate(value: string) {
  return new Date(value).toLocaleString();
}

export function DocumentManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadingDocumentId, setDownloadingDocumentId] = useState('');

  async function loadUsers() {
    const response = await fetch(`${apiBaseUrl}/api/tenant-admin/settings`, {
      cache: 'no-store',
      headers: getAdminAuthHeaders()
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      throw new Error(payload?.message ?? 'Unable to load users.');
    }

    const payload = (await response.json()) as TenantAdminUsersPayload;
    setUsers(payload.users);
    setSelectedUserId((current) => current || payload.users[0]?.id || '');
    return payload.users;
  }

  async function loadDocuments(userId: string) {
    if (!userId) {
      setDocuments([]);
      return;
    }

    const response = await fetch(`${apiBaseUrl}/api/documents`, {
      cache: 'no-store',
      headers: {
        'x-user-id': userId
      }
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      throw new Error(payload?.message ?? 'Unable to load documents.');
    }

    const payload = (await response.json()) as DocumentRecord[];
    setDocuments(payload);
  }

  async function refreshData(nextUserId?: string) {
    setIsLoading(true);
    setError('');

    try {
      const loadedUsers = users.length > 0 ? users : await loadUsers();
      const activeUserId =
        nextUserId ?? selectedUserId ?? loadedUsers[0]?.id ?? '';
      if (!selectedUserId && activeUserId) {
        setSelectedUserId(activeUserId);
      }
      await loadDocuments(activeUserId);
    } catch (loadError) {
      setDocuments([]);
      if (loadError instanceof Error) {
        setError(loadError.message);
      } else {
        setError('API unavailable. Start the local API and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refreshData();
  }, []);

  useEffect(() => {
    if (!selectedUserId) {
      return;
    }

    void refreshData(selectedUserId);
  }, [selectedUserId]);

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedUserId) {
      setError('Select a user before uploading.');
      return;
    }

    if (!selectedFile) {
      setError('Choose a file to upload.');
      return;
    }

    setError('');
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(`${apiBaseUrl}/api/documents/upload`, {
        method: 'POST',
        headers: {
          'x-user-id': selectedUserId
        },
        body: formData
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setError(payload?.message ?? 'Unable to upload document.');
        return;
      }

      setSelectedFile(null);
      const form = event.currentTarget;
      form.reset();
      await loadDocuments(selectedUserId);
    } catch {
      setError('Unable to upload document.');
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDownload(record: DocumentRecord) {
    if (!selectedUserId) {
      setError('Select a user before downloading.');
      return;
    }

    setError('');
    setDownloadingDocumentId(record.id);

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/documents/${record.id}/download`,
        {
          headers: {
            'x-user-id': selectedUserId
          }
        }
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setError(payload?.message ?? 'Unable to download document.');
        return;
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = downloadUrl;
      link.download = record.filename;
      link.click();
      URL.revokeObjectURL(downloadUrl);
    } catch {
      setError('Unable to download document.');
    } finally {
      setDownloadingDocumentId('');
    }
  }

  const selectedUser = users.find((user) => user.id === selectedUserId) ?? null;

  return (
    <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <SectionCard
        title="Upload document"
        description="Upload tenant-scoped files as a user in the active tenant."
      >
        <form className="space-y-5" onSubmit={handleUpload}>
          <label className="block">
            <span className="text-sm font-medium text-admin-text">
              Acting user
            </span>
            <select
              className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
              required
            >
              <option value="" disabled>
                Select user
              </option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName}
                </option>
              ))}
            </select>
          </label>

          {selectedUser ? (
            <div className="rounded-2xl border border-admin-border bg-slate-50 px-4 py-3 text-sm text-admin-muted">
              Uploads and document list are scoped to the active tenant as `
              {selectedUser.email}`.
            </div>
          ) : null}

          <label className="block">
            <span className="text-sm font-medium text-admin-text">File</span>
            <input
              className="mt-2 block w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none file:mr-4 file:rounded-full file:border-0 file:bg-admin-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
              type="file"
              onChange={(event) =>
                setSelectedFile(event.target.files?.[0] ?? null)
              }
              required
            />
          </label>

          {error ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isUploading}
            className="rounded-full bg-admin-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isUploading ? 'Uploading...' : 'Upload file'}
          </button>
        </form>
      </SectionCard>

      <SectionCard
        title="Documents"
        description="Tenant-scoped document inventory with direct downloads."
      >
        {isLoading ? (
          <p className="text-sm text-admin-muted">Loading documents...</p>
        ) : documents.length === 0 ? (
          <p className="text-sm text-admin-muted">
            No documents found for the selected user&apos;s tenant.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-admin-border">
            <table className="min-w-full divide-y divide-admin-border bg-white text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.18em] text-admin-muted">
                <tr>
                  <th className="px-4 py-3">Filename</th>
                  <th className="px-4 py-3">Size</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Upload date</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border text-admin-text">
                {documents.map((record) => (
                  <tr key={record.id}>
                    <td className="px-4 py-3 font-medium">{record.filename}</td>
                    <td className="px-4 py-3 text-admin-muted">
                      {formatFileSize(record.sizeBytes)}
                    </td>
                    <td className="px-4 py-3 text-admin-muted">
                      {record.mimeType}
                    </td>
                    <td className="px-4 py-3 text-admin-muted">
                      {formatUploadDate(record.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => void handleDownload(record)}
                        disabled={downloadingDocumentId === record.id}
                        className="rounded-full border border-admin-border px-4 py-2 text-sm font-semibold text-admin-text transition hover:border-admin-accent hover:text-admin-accent disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {downloadingDocumentId === record.id
                          ? 'Downloading...'
                          : 'Download'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
