import { fireEvent, screen } from '@testing-library/react';
import { setViewportWidth } from '@/test/matchMedia';
import { renderRoute, signedIn } from '@/test/renderRoute';

const renderAt = (path: string) => renderRoute(path).router;

const lockup = () => screen.queryByRole('img', { name: 'Просто ЛІС — база знань' });

describe('MobileShell', () => {
  it.each(['/menu', '/menu/soup-1', '/games'])('shows the lockup on %s', async (path) => {
    renderAt(path);
    await screen.findByRole('heading', { level: 1 });
    expect(lockup()).toBeInTheDocument();
  });

  it.each(['/cards', '/profile', '/games/quiz'])('hides the lockup on %s', async (path) => {
    renderAt(path);
    await screen.findByRole('heading', { level: 1 });
    expect(lockup()).not.toBeInTheDocument();
  });

  it('marks the current section in the bottom nav', async () => {
    renderAt('/cards');
    const nav = await screen.findByRole('navigation', { name: 'основна навігація' });
    expect(nav.querySelector('[aria-current="page"]')).toHaveTextContent('картки');
    expect(nav.querySelectorAll('a')).toHaveLength(4);
  });
});

describe('DesktopShell', () => {
  beforeEach(() => setViewportWidth(1440));

  it('navigates with keys 1–4 (by key code, so the Ukrainian layout works)', async () => {
    const router = renderAt('/menu');
    await screen.findByRole('heading', { level: 1, name: 'дитяче меню' });
    fireEvent.keyDown(window, { code: 'Digit2', key: '2' });
    expect(await screen.findByRole('heading', { level: 1, name: 'картки' })).toBeInTheDocument();
    fireEvent.keyDown(window, { code: 'Digit4', key: '4' });
    expect(router.state.location.pathname).toBe('/profile');
  });

  it('ignores shortcuts with modifiers or while typing', async () => {
    const router = renderAt('/menu');
    await screen.findByRole('heading', { level: 1, name: 'дитяче меню' });
    fireEvent.keyDown(window, { code: 'Digit3', key: '3', metaKey: true });
    const input = document.createElement('input');
    document.body.append(input);
    fireEvent.keyDown(input, { code: 'Digit3', key: '3' });
    input.remove();
    expect(router.state.location.pathname).toBe('/menu');
  });
  it('shows the signed-in user and hides the manager item from waiters', async () => {
    renderRoute('/menu', signedIn('waiter'));
    await screen.findByRole('heading', { level: 1, name: 'дитяче меню' });
    expect(screen.getByText('Олена Коваль')).toBeInTheDocument();
    expect(screen.getByText('офіціант')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /керування меню/ })).not.toBeInTheDocument();
    fireEvent.keyDown(window, { code: 'KeyM', key: 'm' });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('дитяче меню');
  });

  it('gives managers the manager item and the M shortcut', async () => {
    const { router } = renderRoute('/menu', signedIn('manager'));
    await screen.findByRole('heading', { level: 1, name: 'дитяче меню' });
    expect(screen.getByRole('link', { name: /керування меню/ })).toHaveAttribute('href', '/manager');
    fireEvent.keyDown(window, { code: 'KeyM', key: 'ь' });
    expect(await screen.findByRole('heading', { level: 1, name: 'керування меню' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/manager');
  });
});
