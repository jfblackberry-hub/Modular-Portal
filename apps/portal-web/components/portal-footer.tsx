import type { PortalSessionUser } from '../lib/portal-session';
import type { TenantBranding } from '../lib/tenant-branding';

export function PortalFooter({
  branding,
  user
}: {
  branding: TenantBranding;
  user: PortalSessionUser;
}) {
  return (
    <footer className="tenant-portal-footer border-t border-[var(--border-subtle)] bg-white">
      <div className="tenant-portal-footer__content mx-auto grid max-w-7xl gap-4 px-4 py-6 text-sm text-[var(--text-secondary)] sm:px-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="tenant-portal-footer__copy-block">
          <p className="tenant-portal-footer__title font-semibold text-[var(--text-primary)]">
            {branding.displayName} member portal
          </p>
          <p className="tenant-portal-footer__copy mt-2 leading-6">
            Support for {user.tenant.name}. Protect your personal health
            information by signing out after each session.
          </p>
        </div>
        <div className="tenant-portal-footer__links flex flex-wrap gap-x-5 gap-y-2">
          <a className="tenant-portal-footer__link" href="/dashboard/help">Accessibility</a>
          <a className="tenant-portal-footer__link" href="/dashboard/help">Privacy</a>
          <a className="tenant-portal-footer__link" href="/dashboard/help">Language support</a>
          <a className="tenant-portal-footer__link" href={branding.supportEmail ? `mailto:${branding.supportEmail}` : '/dashboard/help'}>
            Contact support
          </a>
        </div>
      </div>
    </footer>
  );
}
