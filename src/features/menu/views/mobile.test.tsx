import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MENU } from '@/test/menuFixture';
import { renderRoute } from '@/test/renderRoute';

const lactoseCount = MENU.items.filter((i) => i.allergens.includes('лактоза')).length;

describe('MenuListView (mobile)', () => {
  it('shows food grouped by subcategory with links to each item', async () => {
    renderRoute('/menu');
    expect(await screen.findByRole('heading', { level: 2, name: 'дитяче меню' })).toBeInTheDocument();
    const soups = screen.getByRole('region', { name: 'перші страви' });
    expect(within(soups).getAllByRole('link')).toHaveLength(4);
    expect(within(soups).getByRole('link', { name: /Борщ з пампушкою/ })).toHaveAttribute(
      'href',
      '/menu/item-soup-1',
    );
    expect(screen.getByRole('tab', { name: 'їжа' })).toHaveAttribute('aria-selected', 'true');
  });

  it('switches category with the chips and keeps it in the URL', async () => {
    const { router } = renderRoute('/menu');
    await userEvent.click(await screen.findByRole('tab', { name: 'вино' }));
    expect(router.state.location.search).toBe('?c=wine');
    expect(screen.getByRole('heading', { level: 2, name: 'ігристі та пет-нати' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'перші страви' })).not.toBeInTheDocument();
  });

  it('opens a deep-linked category', async () => {
    renderRoute('/menu?c=spirits');
    expect(await screen.findByRole('tab', { name: 'міцні' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('link', { name: /Johnnie Walker Red Label/ })).toBeInTheDocument();
  });

  it('searches across all categories, tags each result, and keeps the query in item links', async () => {
    const { router } = renderRoute('/menu');
    await userEvent.type(await screen.findByRole('searchbox'), 'лактоза');
    expect(screen.getByText(`знайдено: ${lactoseCount}`)).toBeInTheDocument();
    expect(router.state.location.search).toBe('?q=%D0%BB%D0%B0%D0%BA%D1%82%D0%BE%D0%B7%D0%B0');
    const first = screen.getAllByRole('link')[0];
    expect(within(first).getByText('їжа')).toBeInTheDocument();
    expect(first.getAttribute('href')).toContain('?q=');
  });

  it('says so when nothing matches, and restores the menu when cleared', async () => {
    renderRoute('/menu');
    await userEvent.type(await screen.findByRole('searchbox'), 'піца');
    expect(screen.getByText('нічого не знайдено за «піца»')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'очистити пошук' }));
    expect(screen.getByRole('heading', { level: 2, name: 'дитяче меню' })).toBeInTheDocument();
  });
});

describe('ItemDetailView (mobile)', () => {
  it('shows a food item with allergens first, then composition and the empty pairing state', async () => {
    renderRoute('/menu/item-soup-1');
    expect(await screen.findByRole('heading', { level: 1, name: /Борщ з пампушкою/ })).toBeInTheDocument();
    expect(screen.getByRole('tabpanel', { name: 'алергени' })).toHaveTextContent('глютен, лактоза');
    await userEvent.click(screen.getByRole('tab', { name: 'склад' }));
    expect(screen.getByRole('tabpanel', { name: 'склад' })).toHaveTextContent('Овочевий бульйон');
    await userEvent.click(screen.getByRole('tab', { name: 'поєднання' }));
    expect(screen.getByText('поєднання ще не заповнене')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'фраза для продажу' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'цікавий факт' })).toBeInTheDocument();
    expect(screen.getByText('оновлено 26.09.2026')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /фото подачі/ })).toHaveTextContent('фото подачі');
  });

  it('shows wine grape, taste profile and producer', async () => {
    renderRoute('/menu/item-wine-1');
    await screen.findByRole('heading', { level: 1, name: /Grand Admiral/ });
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['сорт', 'профіль', 'поєднання']);
    expect(screen.getByRole('tabpanel')).toHaveTextContent('солодкість: брют натур');
    await userEvent.click(screen.getByRole('tab', { name: 'профіль' }));
    expect(screen.getByText('Кислотність').nextElementSibling).toHaveAccessibleName('3 з 3');
    expect(screen.getByRole('heading', { name: 'виробник' })).toBeInTheDocument();
  });

  it('goes back to the category when opened directly', async () => {
    renderRoute('/menu/item-wine-1');
    expect(await screen.findByRole('link', { name: /назад/ })).toHaveAttribute('href', '/menu?c=wine');
  });

  it('returns to the list with the search intact when opened from it', async () => {
    const { router } = renderRoute('/menu?q=%D0%B1%D0%BE%D1%80%D1%89');
    await userEvent.click(await screen.findByRole('link', { name: /Борщ з пампушкою/ }));
    await userEvent.click(await screen.findByRole('button', { name: /назад/ }));
    expect(router.state.location.pathname).toBe('/menu');
    expect(screen.getByRole('searchbox')).toHaveValue('борщ');
  });

  it('explains when the item no longer exists', async () => {
    renderRoute('/menu/item-gone');
    expect(await screen.findByRole('heading', { name: 'позицію не знайдено' })).toBeInTheDocument();
  });
});
