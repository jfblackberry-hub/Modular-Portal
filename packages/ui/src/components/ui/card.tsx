import type { HTMLAttributes, ReactNode } from 'react';

import { borderRadius, colors, shadows, spacing, typography } from '../../design/tokens';

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  icon?: ReactNode;
  body?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
}

export function Card({
  title,
  icon,
  body,
  action,
  children,
  style,
  ...props
}: CardProps) {
  const content = body ?? children;

  return (
    <section
      {...props}
      style={{
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: borderRadius.large,
        boxShadow: shadows.card,
        padding: spacing[4],
        color: colors.textPrimary,
        fontFamily: typography.fontFamily,
        ...(style ?? {})
      }}
    >
      {title || icon || action ? (
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: content ? spacing[3] : 0,
            gap: spacing[2]
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
            {icon}
            {title ? (
              <h3
                style={{
                  margin: 0,
                  fontSize: typography.fontSize.h3,
                  fontWeight: typography.fontWeight.semibold,
                  lineHeight: 1.2
                }}
              >
                {title}
              </h3>
            ) : null}
          </div>
          {action}
        </header>
      ) : null}
      {content}
    </section>
  );
}
