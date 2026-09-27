import type { ReactNode } from 'react';
import SectionTitle from './SectionTitle';

interface PlaceholderProps {
  title: string;
  /** Backlog ticket that replaces this placeholder */
  ticket?: string;
  children?: ReactNode;
}

/** Temporary screen body used until the real view lands (see docs/BACKLOG.md). */
export default function Placeholder({ title, ticket, children }: PlaceholderProps) {
  return (
    <section className="flex flex-col gap-3.5">
      <SectionTitle as="h1">{title}</SectionTitle>
      {ticket && <p className="text-sm text-muted">екран у розробці · {ticket}</p>}
      {children}
    </section>
  );
}
