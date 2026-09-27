import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

interface ButtonProps extends ComponentProps<'button'> {
  variant?: 'ok' | 'no' | 'ghost';
  size?: 'md' | 'sm';
  fullWidth?: boolean;
}

const VARIANTS = {
  ok: 'bg-green text-text hover:bg-green-hi',
  no: 'bg-warn-bg text-warn hover:brightness-110',
  ghost: 'border border-line text-muted hover:text-text',
} as const;

export default function Button({
  variant = 'ok',
  size = 'md',
  fullWidth = false,
  type = 'button',
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-ui text-[15px] transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-40',
        size === 'md' ? 'min-h-12 px-[18px]' : 'min-h-11 px-4 text-sm',
        fullWidth && 'w-full',
        VARIANTS[variant],
        className,
      )}
      {...rest}
    />
  );
}
