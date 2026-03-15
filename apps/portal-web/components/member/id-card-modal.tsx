'use client';

import { X } from 'lucide-react';

type IDCardModalProps = {
  isOpen: boolean;
  memberId: string;
  memberName: string;
  onClose: () => void;
  planName: string;
};

function CardFace({
  label,
  children
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <section className="rounded-2xl bg-gradient-to-br from-white via-sky-50/60 to-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-[var(--tenant-primary-color)]">{label}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function IDCardModal({
  isOpen,
  memberId,
  memberName,
  onClose,
  planName
}: IDCardModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Full member ID card"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close ID card modal"
        className="absolute inset-0 bg-slate-900/50 modal-fade-in"
      />
      <div className="modal-scale-in relative z-10 w-full max-w-3xl rounded-2xl bg-white p-5 shadow-xl md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Digital ID Card</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--bg-page)] text-[var(--text-secondary)] transition hover:bg-slate-200 active:scale-[0.96]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <CardFace label="Front Card">
            <p className="text-sm text-[var(--text-secondary)]">Plan</p>
            <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{planName}</p>
            <p className="mt-4 text-sm text-[var(--text-secondary)]">Member</p>
            <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{memberName}</p>
            <p className="mt-4 text-sm text-[var(--text-secondary)]">Member ID</p>
            <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{memberId}</p>
          </CardFace>

          <CardFace label="Back Card">
            <dl className="space-y-3 text-sm text-[var(--text-secondary)]">
              <div>
                <dt className="font-semibold text-[var(--text-primary)]">Member Services</dt>
                <dd>1-800-555-0199</dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--text-primary)]">Pharmacy Help Desk</dt>
                <dd>1-800-555-0144</dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--text-primary)]">Telehealth</dt>
                <dd>Use Find Care for urgent virtual options.</dd>
              </div>
            </dl>
          </CardFace>
        </div>
      </div>
    </div>
  );
}
