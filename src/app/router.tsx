import { lazy, Suspense } from 'react';
import { Navigate, type RouteObject } from 'react-router';
import { RequireAuth, RequireRole } from './guards';
import LayoutSwitch from './LayoutSwitch';
import type { ShellHandle } from './navigation';
import NotFound from './NotFound';
import ShellLayout from './ShellLayout';

// Views load per route, so phones fetch only mobile views and desktops only desktop views.
const LoginView = lazy(() => import('@/features/auth/views/LoginView'));
const CardsViewDesktop = lazy(() => import('@/features/flashcards/views/desktop/CardsView'));
const CardsViewMobile = lazy(() => import('@/features/flashcards/views/mobile/CardsView'));
const GameRunViewDesktop = lazy(() => import('@/features/games/views/desktop/GameRunView'));
const GamesGridView = lazy(() => import('@/features/games/views/desktop/GamesGridView'));
const GameRunViewMobile = lazy(() => import('@/features/games/views/mobile/GameRunView'));
const GamesListView = lazy(() => import('@/features/games/views/mobile/GamesListView'));
const ManagerView = lazy(() => import('@/features/manager/views/desktop/ManagerView'));
const DesktopOnly = lazy(() => import('@/features/manager/views/mobile/DesktopOnly'));
const MenuPanesView = lazy(() => import('@/features/menu/views/desktop/MenuPanesView'));
const ItemDetailView = lazy(() => import('@/features/menu/views/mobile/ItemDetailView'));
const MenuListView = lazy(() => import('@/features/menu/views/mobile/MenuListView'));
const ProfileViewDesktop = lazy(() => import('@/features/profile/views/desktop/ProfileView'));
const ProfileViewMobile = lazy(() => import('@/features/profile/views/mobile/ProfileView'));

const lockup: ShellHandle = { lockup: true };

// Component gallery for developers; never part of the production bundle.
const devRoutes: RouteObject[] = import.meta.env.DEV
  ? [{ path: '/dev/ui', lazy: async () => ({ Component: (await import('@/dev/UiGallery')).default }) }]
  : [];

export const routes: RouteObject[] = [
  {
    path: '/login',
    element: (
      <Suspense fallback={null}>
        <LoginView />
      </Suspense>
    ),
  },
  ...devRoutes,
  {
    element: <RequireAuth />,
    children: [
      {
        path: '/',
        element: <ShellLayout />,
        children: [
          { index: true, element: <Navigate to="/menu" replace /> },
          {
            path: 'menu',
            handle: lockup,
            element: <LayoutSwitch mobile={<MenuListView />} desktop={<MenuPanesView />} />,
          },
          {
            path: 'menu/:itemId',
            handle: lockup,
            element: <LayoutSwitch mobile={<ItemDetailView />} desktop={<MenuPanesView />} />,
          },
          {
            path: 'cards',
            element: <LayoutSwitch mobile={<CardsViewMobile />} desktop={<CardsViewDesktop />} />,
          },
          {
            path: 'games',
            handle: lockup,
            element: <LayoutSwitch mobile={<GamesListView />} desktop={<GamesGridView />} />,
          },
          {
            path: 'games/:mode',
            handle: { hideNav: true, noSectionHotkeys: true } satisfies ShellHandle,
            element: <LayoutSwitch mobile={<GameRunViewMobile />} desktop={<GameRunViewDesktop />} />,
          },
          {
            path: 'profile',
            element: <LayoutSwitch mobile={<ProfileViewMobile />} desktop={<ProfileViewDesktop />} />,
          },
          {
            path: 'manager',
            element: (
              <RequireRole allow="manager">
                <LayoutSwitch mobile={<DesktopOnly />} desktop={<ManagerView />} />
              </RequireRole>
            ),
          },
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
];
