import { StatusBadge, SurfaceCard } from '../../../components/portal-ui';
import { PortalHeroBanner } from '../../../components/shared/portal-hero-banner';

const providers = [
  {
    id: 'prov-1',
    name: 'North Harbor Clinic',
    specialty: 'Primary care',
    distance: '2.4 miles',
    status: 'In network'
  },
  {
    id: 'prov-2',
    name: 'Lakeview Behavioral Health',
    specialty: 'Behavioral health',
    distance: '5.1 miles',
    status: 'In network'
  },
  {
    id: 'prov-3',
    name: 'Summit Specialty Center',
    specialty: 'Cardiology',
    distance: '8.0 miles',
    status: 'Referral suggested'
  }
];

export default async function ProvidersPage() {
  const providerHeroImage = '/assets/portal-images/custom/provider-dashboard-physician-hero.png';

  return (
    <div className="space-y-6">
      <PortalHeroBanner
        eyebrow="Find care"
        title="Find a provider"
        description="Search common care options, compare network status, and start the next step in a guided provider experience."
        imageSrc={providerHeroImage}
        imageClassName="aspect-[16/6] sm:aspect-[16/5]"
        imageDecorative
        layout="stacked"
        priority
      />

      <SurfaceCard
        title="Provider search"
        description="Use specialty, location, and access preferences to narrow your options."
      >
        <div className="grid gap-3 md:grid-cols-[1.2fr_repeat(3,minmax(0,1fr))]">
          <input className="portal-input px-4 py-3 text-sm outline-none" placeholder="Search by provider or specialty" aria-label="Search by provider or specialty" />
          <select className="portal-input px-4 py-3 text-sm outline-none" aria-label="Select specialty">
            <option>All specialties</option>
            <option>Primary care</option>
            <option>Behavioral health</option>
            <option>Cardiology</option>
          </select>
          <select className="portal-input px-4 py-3 text-sm outline-none" aria-label="Select distance">
            <option>Within 10 miles</option>
            <option>Within 25 miles</option>
            <option>Telehealth only</option>
          </select>
          <button className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-5 py-3 text-sm font-semibold text-white">
            Search
          </button>
        </div>
      </SurfaceCard>

      <div className="grid gap-4">
        {providers.map((provider) => (
          <SurfaceCard
            key={provider.id}
            title={provider.name}
            description={`${provider.specialty} • ${provider.distance}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <StatusBadge label={provider.status} />
              <div className="flex flex-wrap gap-3">
                <button className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] bg-white px-5 py-3 text-sm font-semibold text-[var(--tenant-primary-color)]">
                  View details
                </button>
                <button className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-5 py-3 text-sm font-semibold text-white">
                  Call office
                </button>
              </div>
            </div>
          </SurfaceCard>
        ))}
      </div>
    </div>
  );
}
