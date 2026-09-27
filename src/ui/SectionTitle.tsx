import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface SectionTitleProps {
  children: ReactNode;
  as?: 'h1' | 'h2' | 'h3';
  divider?: boolean;
  size?: 'md' | 'sm';
  className?: string;
}

/** Green mono heading («перші страви») with the thin divider from the PDF. */
export default function SectionTitle({
  children,
  as: Tag = 'h2',
  divider = true,
  size = 'md',
  className,
}: SectionTitleProps) {
  return (
    <Tag
      className={cn(
        'm-0 font-mono font-extrabold text-green-hi',
        size === 'md' ? 'text-xl desk:text-[22px]' : 'text-[17px]',
        divider && 'border-b border-line-soft pb-2',
        className,
      )}
    >
      {children}
    </Tag>
  );
}
