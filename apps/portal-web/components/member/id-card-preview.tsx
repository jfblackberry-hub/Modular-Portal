'use client';

import { CreditCard, Download, QrCode, WalletCards } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@payer-portal/ui';

import { IDCardModal } from './id-card-modal';

type IDCardPreviewProps = {
  enableDownloadPdf?: boolean;
  enableQrCode?: boolean;
  enableWalletIntegration?: boolean;
  groupNumber: string;
  memberId: string;
  memberName: string;
  planName: string;
};

export function IDCardPreview({
  enableDownloadPdf = false,
  enableQrCode = false,
  enableWalletIntegration = false,
  groupNumber,
  memberId,
  memberName,
  planName
}: IDCardPreviewProps) {
  const [isModalOpen, setModalOpen] = useState(false);

  return (
    <>
      <section className="mt-6 overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--tenant-primary-soft-color)]/45 via-white to-sky-50/45 p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[var(--tenant-primary-color)]">Digital ID Card</p>
            <h3 className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{planName}</h3>
          </div>
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 text-[var(--tenant-primary-color)] shadow-sm">
            <CreditCard size={20} />
          </span>
        </div>

        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Member Name</dt>
            <dd className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{memberName}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Member ID</dt>
            <dd className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{memberId}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Group Number</dt>
            <dd className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{groupNumber}</dd>
          </div>
        </dl>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button
            size="medium"
            variant="primary"
            className="active:scale-[0.98]"
            onClick={() => setModalOpen(true)}
          >
            View Full ID Card
          </Button>
          {enableQrCode ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
              <QrCode size={14} /> QR Ready
            </span>
          ) : null}
          {enableWalletIntegration ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
              <WalletCards size={14} /> Wallet Ready
            </span>
          ) : null}
          {enableDownloadPdf ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
              <Download size={14} /> PDF Ready
            </span>
          ) : null}
        </div>
      </section>

      <IDCardModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        memberName={memberName}
        memberId={memberId}
        planName={planName}
      />
    </>
  );
}
