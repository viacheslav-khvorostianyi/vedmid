import { useState } from 'react';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import AuthProvider from '@/features/auth/AuthProvider';
import { ToastProvider } from '@/ui/Toast';
import QueryProvider from './providers/QueryProvider';
import { routes } from './router';

export default function App() {
  // BASE_URL is '/' normally and '/vedmid/' for the GitHub Pages demo.
  const [router] = useState(() =>
    createBrowserRouter(routes, { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' }),
  );
  return (
    <QueryProvider>
      <AuthProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
