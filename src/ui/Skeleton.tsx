import { cn } from '@/lib/cn';

/** Loading placeholder block. Size it with className (e.g. "h-28 w-full"). */
export default function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-ui bg-bg-raised motion-reduce:animate-none', className)}
    />
  );
}
