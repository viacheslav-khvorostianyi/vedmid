import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export default function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-line-soft px-2.5 py-0.5 text-xs text-text',
        className,
      )}
    >
      {children}
    </span>
  );
}
