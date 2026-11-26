import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface TagProps {
  children: ReactNode;
  /** `accent` (brass) marks bestsellers */
  tone?: 'default' | 'accent';
  className?: string;
}

export default function Tag({ children, tone = 'default', className }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs',
        tone === 'accent' ? 'border-accent text-accent' : 'border-line-soft text-text',
        className,
      )}
    >
      {children}
    </span>
  );
}
