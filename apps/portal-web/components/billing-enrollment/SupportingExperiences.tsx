'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { EmptyState, StatusBadge } from '../portal-ui';

type LoadState = 'idle' | 'loading' | 'error';

type DependentRecord = {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  relationship: 'spouse' | 'child' | 'other';
  relationshipDetail: string;
  eligibilityIndicator: 'verified' | 'pending' | 'needs_info';
};

type RequestedDocumentRecord = {
  id: string;
  title: string;
  requiredFor: string;
  dueDate: string;
  status: 'required' | 'uploaded' | 'accepted' | 'rejected' | 'expired';
};

type UploadedDocumentRecord = {
  id: string;
  title: string;
  uploadedAt: string;
  expiresAt?: string;
  status: 'uploaded' | 'accepted' | 'rejected' | 'expired';
};

type NoticeSummary = {
  id: string;
  category: 'enrollment' | 'billing' | 'document' | 'support';
  title: string;
  summary: string;
  createdAt: string;
  isRead: boolean;
  hasDownload: boolean;
};

type NoticeDetail = {
  id: string;
  category: 'enrollment' | 'billing' | 'document' | 'support';
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
  download: null | {
    title: string;
    href: string;
  };
};

function LoadingBlock({ title }: { title: string }) {
  return (
    <section className="portal-card animate-pulse p-5" aria-label={`${title} loading`}>
      <div className="h-4 w-44 rounded bg-slate-200" />
      <div className="mt-4 h-3 w-full rounded bg-slate-200" />
      <div className="mt-2 h-3 w-4/5 rounded bg-slate-200" />
    </section>
  );
}

function BannerMessage({ message, tone }: { message: string; tone: 'success' | 'danger' | 'info' }) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm ${
        tone === 'success'
          ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
          : tone === 'danger'
            ? 'border-rose-300 bg-rose-50 text-rose-900'
            : 'border-sky-300 bg-sky-50 text-sky-900'
      }`}
    >
      {message}
    </div>
  );
}

export function DependentsExperience() {
  const [state, setState] = useState<LoadState>('loading');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<'success' | 'danger' | 'info'>('info');
  const [dependents, setDependents] = useState<DependentRecord[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [householdId] = useState('hh-8843');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    relationship: 'child' as 'spouse' | 'child' | 'other',
    relationshipDetail: ''
  });

  const indicatorSummary = useMemo(() => {
    return {
      verified: dependents.filter((item) => item.eligibilityIndicator === 'verified').length,
      pending: dependents.filter((item) => item.eligibilityIndicator === 'pending').length,
      needsInfo: dependents.filter((item) => item.eligibilityIndicator === 'needs_info').length
    };
  }, [dependents]);

  async function loadDependents() {
    setState('loading');
    setError('');
    try {
      const response = await fetch(`/api/billing-enrollment/dependents?householdId=${encodeURIComponent(householdId)}`, {
        cache: 'no-store'
      });
      if (!response.ok) {
        throw new Error('Unable to load dependents right now.');
      }
      const payload = (await response.json()) as { dependents: DependentRecord[] };
      setDependents(payload.dependents);
      setState('idle');
    } catch (nextError) {
      setState('error');
      setError(nextError instanceof Error ? nextError.message : 'Unable to load dependents right now.');
    }
  }

  useEffect(() => {
    void loadDependents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetForm() {
    setEditingId(null);
    setForm({
      firstName: '',
      lastName: '',
      dob: '',
      relationship: 'child',
      relationshipDetail: ''
    });
  }

  async function saveDependent(event: React.FormEvent) {
    event.preventDefault();
    setMessage('');

    try {
      const request = {
        householdId,
        firstName: form.firstName,
        lastName: form.lastName,
        dob: form.dob,
        relationship: form.relationship,
        relationshipDetail: form.relationshipDetail
      };

      const response = await fetch(
        editingId ? `/api/billing-enrollment/dependents/${editingId}` : '/api/billing-enrollment/dependents',
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(request)
        }
      );

      if (!response.ok) {
        throw new Error(editingId ? 'Unable to update dependent.' : 'Unable to add dependent.');
      }

      const payload = (await response.json()) as DependentRecord;
      setDependents((prev) => {
        if (editingId) {
          return prev.map((item) => (item.id === editingId ? payload : item));
        }
        return [payload, ...prev];
      });
      setMessageTone('success');
      setMessage(editingId ? 'Dependent updated.' : 'Dependent added.');
      resetForm();
    } catch (nextError) {
      setMessageTone('danger');
      setMessage(nextError instanceof Error ? nextError.message : 'Unable to save dependent.');
    }
  }

  async function removeDependentRow(dependentId: string) {
    setMessage('');
    try {
      const response = await fetch(
        `/api/billing-enrollment/dependents/${dependentId}?householdId=${encodeURIComponent(householdId)}`,
        { method: 'DELETE' }
      );
      if (!response.ok) {
        throw new Error('Unable to remove dependent.');
      }
      setDependents((prev) => prev.filter((item) => item.id !== dependentId));
      setMessageTone('success');
      setMessage('Dependent removed.');
      if (editingId === dependentId) {
        resetForm();
      }
    } catch (nextError) {
      setMessageTone('danger');
      setMessage(nextError instanceof Error ? nextError.message : 'Unable to remove dependent.');
    }
  }

  function beginEdit(item: DependentRecord) {
    setEditingId(item.id);
    setForm({
      firstName: item.firstName,
      lastName: item.lastName,
      dob: item.dob,
      relationship: item.relationship,
      relationshipDetail: item.relationshipDetail
    });
  }

  return (
    <div className="space-y-5">
      <section className="portal-card p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--tenant-primary-color)]">Dependents</p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">Household Dependents</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Manage dependents, relationship details, and eligibility verification indicators.</p>
      </section>

      {message ? <BannerMessage message={message} tone={messageTone} /> : null}

      {state === 'loading' ? <LoadingBlock title="Dependents" /> : null}
      {state === 'error' ? <EmptyState title="Unable to load dependents" description={error} /> : null}

      {state === 'idle' ? (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <article className="portal-card p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Verified</p>
              <p className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">{indicatorSummary.verified}</p>
            </article>
            <article className="portal-card p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Pending</p>
              <p className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">{indicatorSummary.pending}</p>
            </article>
            <article className="portal-card p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Needs Info</p>
              <p className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">{indicatorSummary.needsInfo}</p>
            </article>
          </section>

          <section className="grid gap-4 xl:grid-cols-3">
            <article className="portal-card p-5 xl:col-span-2">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Dependents List</h2>
              {dependents.length === 0 ? (
                <div className="mt-4">
                  <EmptyState title="No dependents" description="Add a dependent to begin eligibility verification." />
                </div>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-[var(--border-subtle)] text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                      <tr>
                        <th className="px-2 py-2">Name</th>
                        <th className="px-2 py-2">Relationship</th>
                        <th className="px-2 py-2">DOB</th>
                        <th className="px-2 py-2">Eligibility</th>
                        <th className="px-2 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dependents.map((item) => (
                        <tr key={item.id} className="border-b border-[var(--border-subtle)]">
                          <td className="px-2 py-3 font-medium text-[var(--text-primary)]">{item.firstName} {item.lastName}</td>
                          <td className="px-2 py-3 text-[var(--text-secondary)]">
                            <div>{item.relationship}</div>
                            <div className="text-xs text-[var(--text-muted)]">{item.relationshipDetail}</div>
                          </td>
                          <td className="px-2 py-3 text-[var(--text-secondary)]">{new Date(item.dob).toLocaleDateString()}</td>
                          <td className="px-2 py-3"><StatusBadge label={item.eligibilityIndicator.replace('_', ' ')} /></td>
                          <td className="px-2 py-3">
                            <div className="flex justify-end gap-2">
                              <button type="button" onClick={() => beginEdit(item)} className="rounded-full border border-[var(--tenant-primary-color)] px-3 py-1 text-xs font-semibold text-[var(--tenant-primary-color)]">Edit</button>
                              <button type="button" onClick={() => void removeDependentRow(item.id)} className="rounded-full border border-rose-300 px-3 py-1 text-xs font-semibold text-rose-700">Remove</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </article>

            <article className="portal-card p-5">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">{editingId ? 'Edit Dependent' : 'Add Dependent'}</h2>
              <form className="mt-4 space-y-3" onSubmit={saveDependent}>
                <label className="block text-sm font-medium text-[var(--text-primary)]">
                  First Name
                  <input className="mt-1 h-10 w-full rounded-lg border border-[var(--border-subtle)] px-3" value={form.firstName} onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))} required />
                </label>
                <label className="block text-sm font-medium text-[var(--text-primary)]">
                  Last Name
                  <input className="mt-1 h-10 w-full rounded-lg border border-[var(--border-subtle)] px-3" value={form.lastName} onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))} required />
                </label>
                <label className="block text-sm font-medium text-[var(--text-primary)]">
                  Date of Birth
                  <input type="date" className="mt-1 h-10 w-full rounded-lg border border-[var(--border-subtle)] px-3" value={form.dob} onChange={(event) => setForm((prev) => ({ ...prev, dob: event.target.value }))} required />
                </label>
                <label className="block text-sm font-medium text-[var(--text-primary)]">
                  Relationship
                  <select className="mt-1 h-10 w-full rounded-lg border border-[var(--border-subtle)] px-3" value={form.relationship} onChange={(event) => setForm((prev) => ({ ...prev, relationship: event.target.value as 'spouse' | 'child' | 'other' }))}>
                    <option value="child">Child</option>
                    <option value="spouse">Spouse</option>
                    <option value="other">Other</option>
                  </select>
                </label>
                <label className="block text-sm font-medium text-[var(--text-primary)]">
                  Relationship Detail
                  <input className="mt-1 h-10 w-full rounded-lg border border-[var(--border-subtle)] px-3" value={form.relationshipDetail} onChange={(event) => setForm((prev) => ({ ...prev, relationshipDetail: event.target.value }))} placeholder="Ex: Step child" required />
                </label>
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="inline-flex min-h-10 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-4 py-2 text-sm font-semibold text-white">{editingId ? 'Save Changes' : 'Add Dependent'}</button>
                  {editingId ? (
                    <button type="button" onClick={resetForm} className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--border-subtle)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)]">Cancel</button>
                  ) : null}
                </div>
              </form>
            </article>
          </section>
        </>
      ) : null}
    </div>
  );
}

export function DocumentsExperience() {
  const [state, setState] = useState<LoadState>('loading');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [requested, setRequested] = useState<RequestedDocumentRecord[]>([]);
  const [uploaded, setUploaded] = useState<UploadedDocumentRecord[]>([]);
  const [selectedRequest, setSelectedRequest] = useState('');
  const [documentName, setDocumentName] = useState('');

  async function loadDocuments() {
    setState('loading');
    setError('');
    try {
      const response = await fetch('/api/billing-enrollment/documents', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Unable to load documents right now.');
      }
      const payload = (await response.json()) as {
        requestedDocuments: RequestedDocumentRecord[];
        uploadedDocuments: UploadedDocumentRecord[];
      };
      setRequested(payload.requestedDocuments);
      setUploaded(payload.uploadedDocuments);
      setSelectedRequest(payload.requestedDocuments[0]?.id ?? '');
      setState('idle');
    } catch (nextError) {
      setState('error');
      setError(nextError instanceof Error ? nextError.message : 'Unable to load documents right now.');
    }
  }

  useEffect(() => {
    void loadDocuments();
  }, []);

  async function uploadNow(event: React.FormEvent) {
    event.preventDefault();
    setMessage('');
    try {
      const response = await fetch('/api/billing-enrollment/documents/upload', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          requestId: selectedRequest,
          documentName
        })
      });

      if (!response.ok) {
        throw new Error('Upload failed.');
      }

      const payload = (await response.json()) as UploadedDocumentRecord;
      setUploaded((prev) => [payload, ...prev]);
      setMessage('Document uploaded. Status: uploaded.');
      setDocumentName('');
    } catch (nextError) {
      setMessage(nextError instanceof Error ? nextError.message : 'Upload failed.');
    }
  }

  return (
    <div className="space-y-5">
      <section className="portal-card p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--tenant-primary-color)]">Documents</p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">Requested and Uploaded Documents</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Track document requirements and upload supporting files with clear status visibility.</p>
      </section>

      {message ? <BannerMessage message={message} tone="info" /> : null}

      {state === 'loading' ? <LoadingBlock title="Documents" /> : null}
      {state === 'error' ? <EmptyState title="Unable to load documents" description={error} /> : null}

      {state === 'idle' ? (
        <>
          <section className="grid gap-4 xl:grid-cols-3">
            <article className="portal-card p-5 xl:col-span-2">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Requested Documents</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-[var(--border-subtle)] text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    <tr>
                      <th className="px-2 py-2">Document</th>
                      <th className="px-2 py-2">Required For</th>
                      <th className="px-2 py-2">Due</th>
                      <th className="px-2 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requested.map((item) => (
                      <tr key={item.id} className="border-b border-[var(--border-subtle)]">
                        <td className="px-2 py-3 font-medium text-[var(--text-primary)]">{item.title}</td>
                        <td className="px-2 py-3 text-[var(--text-secondary)]">{item.requiredFor}</td>
                        <td className="px-2 py-3 text-[var(--text-secondary)]">{new Date(item.dueDate).toLocaleDateString()}</td>
                        <td className="px-2 py-3"><StatusBadge label={item.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="portal-card p-5">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Upload Document</h2>
              <form className="mt-4 space-y-3" onSubmit={uploadNow}>
                <label className="block text-sm font-medium text-[var(--text-primary)]">
                  Requested Item
                  <select className="mt-1 h-10 w-full rounded-lg border border-[var(--border-subtle)] px-3" value={selectedRequest} onChange={(event) => setSelectedRequest(event.target.value)}>
                    {requested.map((item) => (
                      <option key={item.id} value={item.id}>{item.title}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-medium text-[var(--text-primary)]">
                  Document Name
                  <input className="mt-1 h-10 w-full rounded-lg border border-[var(--border-subtle)] px-3" value={documentName} onChange={(event) => setDocumentName(event.target.value)} placeholder="Income Verification.pdf" required />
                </label>
                <button type="submit" className="inline-flex min-h-10 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-4 py-2 text-sm font-semibold text-white">Upload</button>
              </form>
            </article>
          </section>

          <section className="portal-card p-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Uploaded Documents</h2>
            {uploaded.length === 0 ? (
              <div className="mt-4">
                <EmptyState title="No uploaded documents" description="Uploaded documents appear here with current review status." />
              </div>
            ) : (
              <ul className="mt-4 space-y-2">
                {uploaded.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border-subtle)] bg-slate-50 px-3 py-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{item.title}</p>
                      <p className="text-xs text-[var(--text-secondary)]">Uploaded {new Date(item.uploadedAt).toLocaleString()}</p>
                    </div>
                    <StatusBadge label={item.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}

export function NoticesExperience() {
  const [state, setState] = useState<LoadState>('loading');
  const [error, setError] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [notices, setNotices] = useState<NoticeSummary[]>([]);
  const [selectedNoticeId, setSelectedNoticeId] = useState('');
  const [detail, setDetail] = useState<NoticeDetail | null>(null);

  const loadNoticeDetail = useCallback(async function loadNoticeDetail(noticeId: string, markRead = true) {
    const response = await fetch(`/api/billing-enrollment/notices/${noticeId}`, { cache: 'no-store' });
    if (!response.ok) {
      return;
    }
    const payload = (await response.json()) as NoticeDetail;
    setDetail(payload);
    if (markRead && !payload.isRead) {
      await fetch(`/api/billing-enrollment/notices/${noticeId}/read`, { method: 'POST' });
      setNotices((prev) => prev.map((item) => (item.id === noticeId ? { ...item, isRead: true } : item)));
      setDetail({ ...payload, isRead: true });
    }
  }, []);

  const loadNotices = useCallback(async function loadNotices(nextUnreadOnly: boolean) {
    setState('loading');
    setError('');
    try {
      const response = await fetch(`/api/billing-enrollment/notices?unreadOnly=${String(nextUnreadOnly)}`, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Unable to load correspondence center.');
      }
      const payload = (await response.json()) as { notices: NoticeSummary[] };
      setNotices(payload.notices);
      const nextId = payload.notices[0]?.id ?? '';
      setSelectedNoticeId(nextId);
      setState('idle');
      if (nextId) {
        await loadNoticeDetail(nextId, false);
      } else {
        setDetail(null);
      }
    } catch (nextError) {
      setState('error');
      setError(nextError instanceof Error ? nextError.message : 'Unable to load correspondence center.');
    }
  }, [loadNoticeDetail]);

  useEffect(() => {
    void loadNotices(unreadOnly);
  }, [loadNotices, unreadOnly]);

  return (
    <div className="space-y-5">
      <section className="portal-card p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--tenant-primary-color)]">Notices</p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">Correspondence Center</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Review enrollment and billing notices with read/unread tracking and downloadable document placeholders.</p>
      </section>

      <section className="portal-card p-4">
        <label className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
          <input type="checkbox" checked={unreadOnly} onChange={(event) => setUnreadOnly(event.target.checked)} />
          Show unread notices only
        </label>
      </section>

      {state === 'loading' ? <LoadingBlock title="Notices" /> : null}
      {state === 'error' ? <EmptyState title="Unable to load notices" description={error} /> : null}

      {state === 'idle' ? (
        <section className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <article className="portal-card p-4">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Inbox</h2>
            {notices.length === 0 ? (
              <div className="mt-3">
                <EmptyState title="No notices" description="New correspondence will appear here." />
              </div>
            ) : (
              <ul className="mt-3 space-y-2">
                {notices.map((notice) => (
                  <li key={notice.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedNoticeId(notice.id);
                        void loadNoticeDetail(notice.id);
                      }}
                      className={`w-full rounded-lg border px-3 py-3 text-left ${selectedNoticeId === notice.id ? 'border-[var(--tenant-primary-color)] bg-[var(--tenant-primary-soft-color)]' : 'border-[var(--border-subtle)] bg-slate-50'}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-[var(--text-primary)]">{notice.title}</p>
                        <StatusBadge label={notice.isRead ? 'Read' : 'Unread'} />
                      </div>
                      <p className="mt-1 text-xs text-[var(--text-secondary)]">{notice.summary}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="portal-card p-5">
            {!detail ? (
              <EmptyState title="Select a notice" description="Choose a notice from the inbox to view details." />
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">{detail.title}</h2>
                  <StatusBadge label={detail.isRead ? 'Read' : 'Unread'} />
                </div>
                <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">{detail.category} • {new Date(detail.createdAt).toLocaleString()}</p>
                <p className="mt-4 whitespace-pre-line text-sm leading-6 text-[var(--text-secondary)]">{detail.body}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button type="button" className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] px-4 py-2 text-sm font-semibold text-[var(--tenant-primary-color)]">Archive Placeholder</button>
                  {detail.download ? (
                    <a href={detail.download.href} className="inline-flex min-h-10 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-4 py-2 text-sm font-semibold text-white">Download PDF Placeholder</a>
                  ) : null}
                </div>
              </>
            )}
          </article>
        </section>
      ) : null}
    </div>
  );
}

export function SupportExperience({ embedded = false }: { embedded?: boolean } = {}) {
  const [state, setState] = useState<LoadState>('loading');
  const [error, setError] = useState('');
  const [contextTopic, setContextTopic] = useState('topic-enrollment');
  const [data, setData] = useState<{
    helpTopics: Array<{ id: string; title: string; description: string }>;
    faq: Array<{ id: string; question: string; answer: string }>;
    secureMessage: { available: boolean; status: string; integrationTarget: string };
    caseStatus: Array<{ id: string; title: string; status: string; updatedAt: string }>;
    contactCards: Array<{ id: string; team: string; phone: string; email: string; hours: string }>;
  } | null>(null);

  useEffect(() => {
    async function load() {
      setState('loading');
      setError('');
      try {
        const response = await fetch('/api/billing-enrollment/support', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Unable to load support center.');
        }
        const payload = (await response.json()) as {
          helpTopics: Array<{ id: string; title: string; description: string }>;
          faq: Array<{ id: string; question: string; answer: string }>;
          secureMessage: { available: boolean; status: string; integrationTarget: string };
          caseStatus: Array<{ id: string; title: string; status: string; updatedAt: string }>;
          contactCards: Array<{ id: string; team: string; phone: string; email: string; hours: string }>;
        };
        setData(payload);
        setContextTopic(payload.helpTopics[0]?.id ?? 'topic-enrollment');
        setState('idle');
      } catch (nextError) {
        setState('error');
        setError(nextError instanceof Error ? nextError.message : 'Unable to load support center.');
      }
    }

    void load();
  }, []);

  const selectedTopic = data?.helpTopics.find((topic) => topic.id === contextTopic);

  return (
    <div className="space-y-5">
      {embedded ? null : (
        <section className="portal-card p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--tenant-primary-color)]">Support</p>
          <h1 className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">Billing & Enrollment Support Center</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Context-aware help, FAQ entry points, secure messaging placeholder, and case status placeholders.</p>
        </section>
      )}

      {state === 'loading' ? <LoadingBlock title="Support" /> : null}
      {state === 'error' ? <EmptyState title="Unable to load support" description={error} /> : null}

      {state === 'idle' && data ? (
        <>
          <section className="portal-card p-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Context-Aware Help Panel</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-[280px_1fr]">
              <select className="h-10 rounded-lg border border-[var(--border-subtle)] px-3" value={contextTopic} onChange={(event) => setContextTopic(event.target.value)}>
                {data.helpTopics.map((topic) => (
                  <option key={topic.id} value={topic.id}>{topic.title}</option>
                ))}
              </select>
              <div className="rounded-lg border border-[var(--border-subtle)] bg-slate-50 px-4 py-3 text-sm text-[var(--text-secondary)]">
                {selectedTopic?.description}
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <article className="portal-card p-5">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">FAQ / Knowledge</h2>
              <ul className="mt-3 space-y-2">
                {data.faq.map((item) => (
                  <li key={item.id} className="rounded-lg border border-[var(--border-subtle)] bg-slate-50 px-3 py-3">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{item.question}</p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">{item.answer}</p>
                  </li>
                ))}
              </ul>
            </article>

            <article className="portal-card p-5">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Secure Message / Case Status</h2>
              <div className="mt-3 rounded-lg border border-[var(--border-subtle)] bg-slate-50 px-3 py-3 text-sm text-[var(--text-secondary)]">
                Secure messaging is currently a placeholder. Planned integration target: {data.secureMessage.integrationTarget}.
              </div>
              <ul className="mt-3 space-y-2">
                {data.caseStatus.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border-subtle)] bg-white px-3 py-2">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{item.title}</p>
                      <p className="text-xs text-[var(--text-secondary)]">Updated {new Date(item.updatedAt).toLocaleString()}</p>
                    </div>
                    <StatusBadge label={item.status} />
                  </li>
                ))}
              </ul>
            </article>
          </section>

          <section className="portal-card p-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Contact Cards</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {data.contactCards.map((card) => (
                <article key={card.id} className="rounded-lg border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{card.team}</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{card.phone}</p>
                  <p className="text-sm text-[var(--text-secondary)]">{card.email}</p>
                  <p className="text-xs text-[var(--text-muted)]">{card.hours}</p>
                </article>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
