import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { borderRadius, colors, spacing, typography } from '../../design/tokens';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, ButtonHTMLAttributes<HTMLButtonElement>['style']> = {
  primary: {
    backgroundColor: colors.primary,
    color: colors.surface,
    border: `1px solid ${colors.primary}`
  },
  secondary: {
    backgroundColor: colors.secondary,
    color: colors.surface,
    border: `1px solid ${colors.secondary}`
  },
  outline: {
    backgroundColor: 'transparent',
    color: colors.primary,
    border: `1px solid ${colors.border}`
  },
  ghost: {
    backgroundColor: 'transparent',
    color: colors.textPrimary,
    border: '1px solid transparent'
  }
};

const sizeStyles: Record<ButtonSize, ButtonHTMLAttributes<HTMLButtonElement>['style']> = {
  small: {
    minHeight: 32,
    padding: `${spacing[2]}px ${spacing[3]}px`,
    fontSize: typography.fontSize.caption
  },
  medium: {
    minHeight: 40,
    padding: `${spacing[2]}px ${spacing[4]}px`,
    fontSize: typography.fontSize.body
  },
  large: {
    minHeight: 48,
    padding: `${spacing[3]}px ${spacing[6]}px`,
    fontSize: typography.fontSize.h3
  }
};

export function Button({
  children,
  variant = 'primary',
  size = 'medium',
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      style={{
        ...variantStyles[variant],
        ...sizeStyles[size],
        borderRadius: borderRadius.medium,
        fontFamily: typography.fontFamily,
        fontWeight: typography.fontWeight.semibold,
        lineHeight: 1.2,
        cursor: 'pointer',
        transition: 'all 140ms ease',
        ...(style ?? {})
      }}
      data-variant={variant}
      data-size={size}
    >
      {children}
    </button>
  );
}
