export function ProviderHeroBrandLockup({
  clinicLogoSrc,
  clinicName
}: {
  clinicLogoSrc: string;
  clinicName: string;
}) {
  return (
    <div className="rounded-2xl bg-white/76 px-3 py-2 shadow-sm backdrop-blur-[1px] sm:px-4 sm:py-3">
      {/* eslint-disable-next-line @next/next/no-img-element -- clinic branding assets are runtime-provided and not safe to route through next/image without broad remote allowlists */}
      <img
        src={clinicLogoSrc}
        alt={`${clinicName} logo`}
        className="h-10 w-auto max-w-[180px] object-contain sm:h-12 sm:max-w-[220px]"
      />
    </div>
  );
}
