import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderRoute, signedOut } from '@/test/renderRoute';
import type * as Api from './api';
import { sendMagicLink, verifyEmailCode } from './api';

vi.mock('./api', async (importOriginal) => ({
  ...(await importOriginal<typeof Api>()),
  sendMagicLink: vi.fn(),
  verifyEmailCode: vi.fn(),
}));

const send = vi.mocked(sendMagicLink);
const verify = vi.mocked(verifyEmailCode);

beforeEach(() => {
  send.mockReset();
  verify.mockReset();
});

async function submitEmail(email: string) {
  await userEvent.type(await screen.findByLabelText('робоча пошта'), email);
  await userEvent.click(screen.getByRole('button', { name: 'надіслати посилання' }));
}

describe('LoginView', () => {
  it('sends a magic link for the normalised email with the return path, then shows the success panel', async () => {
    send.mockResolvedValue(null);
    renderRoute('/login?next=%2Fcards', signedOut);
    await submitEmail(' Olena@ProstoLis.ua ');
    expect(send).toHaveBeenCalledWith('olena@prostolis.ua', '/cards');
    expect(screen.getByText(/Посилання для входу надіслано на/)).toHaveTextContent('olena@prostolis.ua');
  });

  it('never passes an external return path', async () => {
    send.mockResolvedValue(null);
    renderRoute('/login?next=https%3A%2F%2Fevil.example', signedOut);
    await submitEmail('a@b.ua');
    expect(send).toHaveBeenCalledWith('a@b.ua', '/menu');
  });

  it('explains what to do for an email that is not on the staff list', async () => {
    send.mockResolvedValue('unknown_email');
    renderRoute('/login', signedOut);
    await submitEmail('stranger@gmail.com');
    expect(screen.getByRole('alert')).toHaveTextContent('Цієї пошти немає в списку персоналу');
    expect(screen.getByLabelText('робоча пошта')).toHaveAttribute('aria-invalid', 'true');
  });

  it('accepts the 6-digit code as a fallback and reports a wrong code', async () => {
    send.mockResolvedValue(null);
    verify.mockResolvedValue('invalid_code');
    renderRoute('/login', signedOut);
    await submitEmail('a@b.ua');
    const submit = screen.getByRole('button', { name: 'увійти' });
    expect(submit).toBeDisabled();
    await userEvent.type(screen.getByLabelText('або введи 6-значний код з листа'), '12a3456');
    expect(screen.getByLabelText('або введи 6-значний код з листа')).toHaveValue('123456');
    await userEvent.click(submit);
    expect(verify).toHaveBeenCalledWith('a@b.ua', '123456');
    expect(screen.getByRole('alert')).toHaveTextContent('Код не підходить або застарів');
  });

  it('lets the user go back and change the email', async () => {
    send.mockResolvedValue(null);
    renderRoute('/login', signedOut);
    await submitEmail('a@b.ua');
    await userEvent.click(screen.getByRole('button', { name: 'інша пошта' }));
    expect(screen.getByLabelText('робоча пошта')).toBeInTheDocument();
  });

  it('explains an expired magic link', async () => {
    renderRoute('/login?error_description=Email+link+is+invalid+or+has+expired', signedOut);
    expect(await screen.findByRole('alert')).toHaveTextContent('Посилання для входу застаріло');
  });
});
