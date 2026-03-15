import { icons } from 'lucide-react';
import type { LucideProps } from 'lucide-react';

type LucideIconName = keyof typeof icons;

export interface IconProps extends Omit<LucideProps, 'ref'> {
  name: LucideIconName;
  label?: string;
}

export function Icon({ name, label, ...props }: IconProps) {
  const Component = icons[name];

  if (!Component) {
    return null;
  }

  return (
    <Component
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
      {...props}
    />
  );
}
