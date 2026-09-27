import { render, screen } from '@testing-library/react';
import Logo from './Logo';
import Panel from './Panel';
import SectionTitle from './SectionTitle';
import Skeleton from './Skeleton';
import StatTile from './StatTile';
import Tag from './Tag';

describe('display components', () => {
  it('Logo has an accessible name', () => {
    render(<Logo />);
    expect(screen.getByRole('img', { name: 'Просто ЛІС — база знань' })).toBeInTheDocument();
  });

  it('SectionTitle renders the requested heading level, with divider by default', () => {
    render(
      <>
        <SectionTitle>перші страви</SectionTitle>
        <SectionTitle as="h3" divider={false}>
          фраза для продажу
        </SectionTitle>
      </>,
    );
    expect(screen.getByRole('heading', { level: 2, name: 'перші страви' }).className).toContain('border-b');
    expect(screen.getByRole('heading', { level: 3 }).className).not.toContain('border-b');
  });

  it('Panel uses the strong ink by default and the PDF ink on request', () => {
    const { rerender } = render(<Panel>текст</Panel>);
    expect(screen.getByText('текст').className).toContain('text-on-green-strong');
    rerender(<Panel tone="default">текст</Panel>);
    expect(screen.getByText('текст').className).toContain('text-on-green');
  });

  it('StatTile, Tag and Skeleton render', () => {
    const { container } = render(
      <>
        <StatTile value={112} label="знаю карток" />
        <Tag>глютен</Tag>
        <Skeleton className="h-28" />
      </>,
    );
    expect(screen.getByText('112')).toBeInTheDocument();
    expect(screen.getByText('глютен')).toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"].h-28')).toBeInTheDocument();
  });
});
