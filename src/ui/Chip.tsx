import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

/** Shared chip look — also used by nav links styled as chips. */
export function chipClass(selected: boolean, className?: string): string {
  return cn(
    'inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-ui border px-4 text-sm leading-none transition-colors',
    'disabled:cursor-not-allowed disabled:opacity-40',
    selected ? 'border-green bg-green text-text' : 'border-line text-muted hover:text-text',
    className,
  );
}

interface ChipProps extends ComponentProps<'button'> {
  selected?: boolean;
}

/** Filled green when selected, outlined otherwise. Toggle semantics unless a role (e.g. "tab") is given. */
export default function Chip({ selected = false, className, role, type = 'button', ...rest }: ChipProps) {
  const state = role === 'tab' ? { 'aria-selected': selected } : { 'aria-pressed': selected };
  return <button type={type} role={role} className={chipClass(selected, className)} {...state} {...rest} />;
}
