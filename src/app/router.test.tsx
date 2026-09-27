import { act, screen } from '@testing-library/react';
import { setViewportWidth } from '@/test/matchMedia';
import { loading, renderRoute, signedIn, signedOut } from '@/test/renderRoute';

const renderAt = (path: string) => renderRoute(path).router;

const heading = () => screen.findByRole('heading', { level: 1 });

describe('router', () => {
  it('redirects / to /menu in the mobile shell', async () => {
    const router = renderAt('/');
    expect(await heading()).toHaveTextContent('меню');
    expect(router.state.location.pathname).toBe('/menu');
    expect(document.querySelector('[data-shell="mobile"]')).toBeInTheDocument();
  });

  it('renders the desktop shell from 1024px', async () => {
    setViewportWidth(1440);
    renderAt('/cards');
    expect(await heading()).toHaveTextContent('картки');
    expect(document.querySelector('[data-shell="desktop"]')).toBeInTheDocument();
  });

  it('swaps shells on resize without losing the route', async () => {
    const router = renderAt('/menu/item-soup-1');
    expect(await heading()).toHaveTextContent('Борщ з пампушкою');
    act(() => setViewportWidth(1440));
    expect(await screen.findByRole('heading', { level: 2, name: /Борщ з пампушкою/ })).toBeInTheDocument();
    expect(document.querySelector('[data-shell="desktop"]')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/menu/item-soup-1');
  });

  it('renders a known game mode', async () => {
    renderAt('/games/quiz');
    expect(await heading()).toHaveTextContent('вікторина');
  });

  it('renders not found for unknown game modes and paths', async () => {
    renderAt('/games/poker');
    expect(await heading()).toHaveTextContent('сторінку не знайдено');
  });
});

describe('guards', () => {
  it('sends signed-out users to /login, remembering where they were going', async () => {
    const { router } = renderRoute('/games/quiz?x=1', signedOut);
    expect(await screen.findByLabelText('робоча пошта')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(new URLSearchParams(router.state.location.search).get('next')).toBe('/games/quiz?x=1');
    expect(document.querySelector('[data-shell]')).not.toBeInTheDocument();
  });

  it('shows a splash while the session is loading', () => {
    renderRoute('/menu', loading);
    expect(screen.getByLabelText('завантаження')).toHaveAttribute('aria-busy', 'true');
  });

  it('sends signed-in users away from /login to their target', async () => {
    const { router } = renderRoute('/login?next=%2Fcards', signedIn());
    expect(await heading()).toHaveTextContent('картки');
    expect(router.state.location.pathname).toBe('/cards');
  });

  it('keeps waiters out of /manager', async () => {
    const { router } = renderRoute('/manager', signedIn('waiter'));
    expect(await heading()).toHaveTextContent('меню');
    expect(router.state.location.pathname).toBe('/menu');
  });

  it('waits for the profile before deciding on /manager', () => {
    renderRoute('/manager', signedIn('manager', null));
    expect(screen.getByLabelText('завантаження')).toBeInTheDocument();
  });

  it('shows managers the desktop-only message on mobile and the manager view on desktop', async () => {
    renderRoute('/manager', signedIn('manager'));
    expect(await screen.findByText("Керування меню доступне на комп'ютері.")).toBeInTheDocument();
  });

  it('shows managers the manager view on desktop', async () => {
    setViewportWidth(1440);
    renderRoute('/manager', signedIn('manager'));
    expect(await heading()).toHaveTextContent('керування меню');
  });
});
