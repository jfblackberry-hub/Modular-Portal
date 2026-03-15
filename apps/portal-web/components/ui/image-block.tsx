import Image from 'next/image';

export function ImageBlock({
  alt,
  className,
  gradientOverlay = true,
  priority = false,
  rounded = true,
  src
}: {
  alt: string;
  className?: string;
  gradientOverlay?: boolean;
  priority?: boolean;
  rounded?: boolean;
  src: string;
}) {
  return (
    <div
      className={`relative w-full overflow-hidden ${rounded ? 'rounded-2xl' : ''} ${
        className ?? ''
      }`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 40vw"
        priority={priority}
      />
      {gradientOverlay ? (
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/20 via-transparent to-sky-100/30" />
      ) : null}
    </div>
  );
}
