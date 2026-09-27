import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface PanelProps {
  children: ReactNode;
  /** `strong` for long text: darker ink for AA contrast on green (DESIGN §2) */
  tone?: 'default' | 'strong';
  className?: string;
}

export default function Panel({ children, tone = 'strong', className }: PanelProps) {
  return (
    <div
      className={cn(
        'rounded-ui bg-green px-3.5 py-3 text-[14px] leading-relaxed',
        tone === 'strong' ? 'text-on-green-strong' : 'text-on-green',
        className,
      )}
    >
      {children}
    </div>
  );
}
