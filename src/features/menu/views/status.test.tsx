import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MENU_ROWS } from '@/test/menuFixture';
import { renderRoute } from '@/test/renderRoute';
import { fetchMenu } from '../api';

vi.mock('../api', async (importOriginal) => ({
  ...(await importOriginal<typeof Api>()),
  fetchMenu: vi.fn(),
}));
import type * as Api from '../api';

const fetchMock = vi.mocked(fetchMenu);

describe('menu loading and errors', () => {
  it('shows skeletons while the menu loads', async () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    renderRoute('/menu', undefined, { menu: null });
    expect(await screen.findByLabelText('завантажуємо меню')).toHaveAttribute('aria-busy', 'true');
  });

  it('offers a retry when loading fails, and recovers', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(MENU_ROWS);
    renderRoute('/menu', undefined, { menu: null });
    expect(await screen.findByRole('alert')).toHaveTextContent('Не вдалося завантажити меню');
    await userEvent.click(screen.getByRole('button', { name: 'спробувати ще раз' }));
    expect(await screen.findByRole('heading', { level: 2, name: 'дитяче меню' })).toBeInTheDocument();
  });
});
