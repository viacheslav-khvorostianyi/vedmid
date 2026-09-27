import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import ItemCard from './ItemCard';

const TITLE = 'Борщ з пампушкою та салом із чорним часником';

describe('ItemCard', () => {
  it('renders a link when `to` is given', () => {
    render(
      <MemoryRouter>
        <ItemCard title={TITLE} to="/menu/soup-1" />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: TITLE })).toHaveAttribute('href', '/menu/soup-1');
  });

  it('renders a pressed button when selected', async () => {
    const onClick = vi.fn();
    render(<ItemCard title={TITLE} selected onClick={onClick} />);
    const card = screen.getByRole('button', { name: TITLE });
    expect(card).toHaveAttribute('aria-pressed', 'true');
    expect(card.className).toContain('bg-green/35');
    expect(card.className).not.toContain('pt-9');
    await userEvent.click(card);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('shows the category tag in search results', () => {
    render(<ItemCard title="El Capitan Brut" tag="вино" />);
    expect(screen.getByText('вино')).toBeInTheDocument();
    // the badge row sits above the title instead of over it
    expect(screen.getByRole('button').className).toContain('pt-9');
  });
});
