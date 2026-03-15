import type { HTMLAttributes, ReactNode } from 'react';

import { spacing } from '../../design/tokens';

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Container({ children, style, ...props }: ContainerProps) {
  return (
    <div
      {...props}
      style={{
        width: '100%',
        maxWidth: 1200,
        margin: '0 auto',
        paddingLeft: spacing[4],
        paddingRight: spacing[4],
        ...(style ?? {})
      }}
    >
      {children}
    </div>
  );
}
