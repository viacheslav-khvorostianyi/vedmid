import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { supabase } from '@/lib/supabase';
import AuthProvider from './AuthProvider';
import { useAuth } from './context';

vi.mock('@/lib/supabase', () => {
  const auth = {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signOut: vi.fn(async () => ({ error: null })),
  };
  const single = vi.fn();
  return {
    supabase: { auth, from: vi.fn(() => ({ select: () => ({ eq: () => ({ single }) }) })), __single: single },
  };
});

const mocked = supabase as unknown as {
  auth: {
    getSession: ReturnType<typeof vi.fn>;
    onAuthStateChange: ReturnType<typeof vi.fn>;
    signOut: ReturnType<typeof vi.fn>;
  };
  __single: ReturnType<typeof vi.fn>;
};

let emit: (session: unknown) => void;

beforeEach(() => {
  mocked.auth.onAuthStateChange.mockImplementation((cb: (e: string, s: unknown) => void) => {
    emit = (s) => cb('SIGNED_IN', s);
    return { data: { subscription: { unsubscribe: vi.fn() } } };
  });
  mocked.__single.mockResolvedValue({
    data: { id: 'u1', display_name: 'Олена', role: 'manager' },
    error: null,
  });
});

function Probe() {
  const auth = useAuth();
  return (
    <>
      <p>status:{auth.status}</p>
      <p>profile:{auth.profile ? `${auth.profile.displayName}/${auth.profile.role}` : '—'}</p>
      <button type="button" onClick={() => auth.signOut()}>
        вийти
      </button>
    </>
  );
}

function renderProvider() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <Probe />
      </AuthProvider>
    </QueryClientProvider>,
  );
  return client;
}

describe('AuthProvider', () => {
  it('starts loading, then reports signed out without a session', async () => {
    mocked.auth.getSession.mockResolvedValue({ data: { session: null } });
    renderProvider();
    expect(screen.getByText('status:loading')).toBeInTheDocument();
    expect(await screen.findByText('status:signedOut')).toBeInTheDocument();
  });

  it('loads the profile for a session and follows auth changes', async () => {
    mocked.auth.getSession.mockResolvedValue({ data: { session: null } });
    renderProvider();
    await screen.findByText('status:signedOut');
    act(() => emit({ user: { id: 'u1' } }));
    expect(await screen.findByText('status:signedIn')).toBeInTheDocument();
    expect(await screen.findByText('profile:Олена/manager')).toBeInTheDocument();
  });

  it('signs out and wipes cached data', async () => {
    mocked.auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } });
    const client = renderProvider();
    await screen.findByText('profile:Олена/manager');
    client.setQueryData(['stats'], { xp: 10 });
    await userEvent.click(screen.getByRole('button', { name: 'вийти' }));
    expect(mocked.auth.signOut).toHaveBeenCalled();
    await waitFor(() => expect(client.getQueryData(['stats'])).toBeUndefined());
  });
});
