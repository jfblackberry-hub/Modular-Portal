import { SupportLink,SurfaceCard } from '../../../components/portal-ui';
import { PortalHeroBanner } from '../../../components/shared/portal-hero-banner';
import { getPortalImageSrc } from '../../../lib/portal-image-registry';
import { getPortalSessionUser } from '../../../lib/portal-session';

export default async function HelpPage() {
  const sessionUser = await getPortalSessionUser();
  const supportHeroImage = getPortalImageSrc('supportHero', {
    tenantBrandingConfig: sessionUser?.tenant.brandingConfig
  });

  return (
    <div className="space-y-6">
      <PortalHeroBanner
        eyebrow="Help"
        title="Help and support"
        description="Find answers, accessibility resources, language support, and the fastest path to member services."
        imageSrc={supportHeroImage}
        imageDecorative
        priority
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SupportLink
          href="tel:18005550199"
          label="Call member services"
          description="Reach a representative for coverage, claims, or billing support."
        />
        <SupportLink
          href="/dashboard/messages"
          label="Secure message"
          description="Send protected questions and attach supporting documents."
        />
        <SupportLink
          href="/dashboard/help"
          label="Accessibility"
          description="Review keyboard, contrast, and assistive support guidance."
        />
        <SupportLink
          href="/dashboard/help"
          label="Language support"
          description="Request interpreter support and alternate language help."
        />
      </div>

      <SurfaceCard
        title="Frequently asked questions"
        description="Common support topics for a healthcare payer portal."
      >
        <div className="space-y-4">
          {[
            ['How do I replace my ID card?', 'Open the ID card page and request a reprint through secure messaging if details are incorrect.'],
            ['How do I read a claim status?', 'Claims include a status pill, billed amount, member responsibility estimate, and supporting detail page.'],
            ['Where can I get help in another language?', 'Use the language support link or call member services for interpreter assistance.']
          ].map(([question, answer]) => (
            <article key={question} className="rounded-2xl bg-[var(--bg-page)] p-5">
              <h3 className="text-base font-semibold text-[var(--text-primary)]">{question}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{answer}</p>
            </article>
          ))}
        </div>
      </SurfaceCard>
    </div>
  );
}
