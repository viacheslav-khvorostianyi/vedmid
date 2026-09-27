import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setViewportWidth } from '@/test/matchMedia';
import { renderRoute } from '@/test/renderRoute';

beforeEach(() => setViewportWidth(1440));

const results = () => screen.getByRole('heading', { level: 1 }).parentElement!;

describe('MenuPanesView (desktop)', () => {
  it('lists subcategories with counts and shows the first one', async () => {
    renderRoute('/menu');
    expect(await screen.findByRole('heading', { level: 1, name: 'дитяче меню' })).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'підкатегорії' });
    expect(within(nav).getByRole('button', { name: /Перші страви\s*4/ })).toBeInTheDocument();
    expect(within(nav).getByRole('button', { name: /Дитяче меню/ })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByText(/Обери позицію зі списку/)).toBeInTheDocument();
  });

  it('switches subcategory and opens an item in the side pane without leaving the list', async () => {
    const { router } = renderRoute('/menu');
    await userEvent.click(await screen.findByRole('button', { name: /Перші страви/ }));
    expect(screen.getByRole('heading', { level: 1, name: 'перші страви' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: /Борщ з пампушкою/ }));
    expect(router.state.location.pathname).toBe('/menu/item-soup-1');
    const pane = screen.getByRole('complementary', { name: 'деталі позиції' });
    expect(within(pane).getByRole('heading', { level: 2, name: /Борщ з пампушкою/ })).toBeInTheDocument();
    // stacked: all sections at once, no tabs
    expect(within(pane).queryByRole('tab')).not.toBeInTheDocument();
    expect(within(pane).getByRole('heading', { name: 'склад' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Борщ з пампушкою/ })).toHaveAttribute('aria-current', 'true');
  });

  it('opens the category and subcategory of a deep-linked item', async () => {
    renderRoute('/menu/item-wine-1');
    expect(await screen.findByRole('tab', { name: 'вино' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('heading', { level: 1, name: 'ігристі та пет-нати' })).toBeInTheDocument();
  });

  it('moves the selection with ↑/↓ and focuses the detail with Enter', async () => {
    const { router } = renderRoute('/menu?c=food&s=2');
    const heading = await screen.findByRole('heading', { level: 1 });
    const cards = within(results()).getAllByRole('link');
    fireEvent.keyDown(window, { code: 'ArrowDown', key: 'ArrowDown' });
    expect(router.state.location.pathname).toBe(cards[0].getAttribute('href')!.split('?')[0]);
    fireEvent.keyDown(window, { code: 'ArrowDown', key: 'ArrowDown' });
    fireEvent.keyDown(window, { code: 'ArrowUp', key: 'ArrowUp' });
    expect(router.state.location.pathname).toBe(cards[0].getAttribute('href')!.split('?')[0]);
    fireEvent.keyDown(window, { code: 'Enter', key: 'Enter' });
    expect(screen.getByRole('complementary', { name: 'деталі позиції' })).toHaveFocus();
    expect(heading).toBeInTheDocument();
  });

  it('focuses search with / and clears it with Escape', async () => {
    renderRoute('/menu');
    await screen.findByRole('heading', { level: 1 });
    fireEvent.keyDown(window, { code: 'Slash', key: '/' });
    const search = screen.getByRole('searchbox');
    expect(search).toHaveFocus();
    await userEvent.type(search, 'el capitan');
    expect(screen.getByRole('heading', { level: 1, name: 'пошук: el capitan' })).toBeInTheDocument();
    expect(within(results()).getAllByText('вино').length).toBeGreaterThan(0);
    await userEvent.keyboard('{Escape}');
    expect(search).toHaveValue('');
    expect(screen.getByRole('heading', { level: 1, name: 'дитяче меню' })).toBeInTheDocument();
  });
});
