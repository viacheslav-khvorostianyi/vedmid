import { useState, type FormEvent } from 'react';
import { Navigate, useSearchParams } from 'react-router';
import Button from '@/ui/Button';
import Logo from '@/ui/Logo';
import { SIGN_IN_ERRORS, sendMagicLink, verifyEmailCode, type SignInErrorKind } from '../api';
import { useAuth } from '../context';
import { safeNext } from '../redirect';

const INPUT =
  'min-h-12 w-full rounded-ui border border-line-soft bg-bg-raised px-3.5 text-[15px] text-text outline-none focus:border-line';

export default function LoginView() {
  const auth = useAuth();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const linkError = params.get('error_description');

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<SignInErrorKind | null>(null);

  if (auth.status === 'signedIn') return <Navigate to={next} replace />;

  async function onSend(e: FormEvent) {
    e.preventDefault();
    const address = email.trim().toLowerCase();
    if (!address) return;
    setBusy(true);
    setError(null);
    const err = await sendMagicLink(address, next);
    setBusy(false);
    if (err) setError(err);
    else setSentTo(address);
  }

  async function onVerify(e: FormEvent) {
    e.preventDefault();
    if (!sentTo || code.length !== 6) return;
    setBusy(true);
    setError(null);
    const err = await verifyEmailCode(sentTo, code);
    setBusy(false);
    if (err) setError(err);
    // on success onAuthStateChange signs the user in and the redirect above takes over
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-[400px] flex-col justify-center gap-5 px-4 py-10">
      <Logo size="lg" stacked className="mb-2" />

      {linkError && !sentTo && (
        <p role="alert" className="m-0 text-sm text-warn">
          Посилання для входу застаріло або вже використане. Надішли нове.
        </p>
      )}

      {!sentTo ? (
        <form onSubmit={onSend} className="flex flex-col gap-3" noValidate>
          <label htmlFor="login-email" className="text-[13px] text-muted">
            робоча пошта
          </label>
          <input
            id="login-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ім'я@prostolis.ua"
            className={INPUT}
            aria-invalid={error === 'unknown_email' || error === 'invalid_email' || undefined}
            aria-describedby={error ? 'login-error' : undefined}
          />
          <Button type="submit" fullWidth disabled={busy || !email.trim()}>
            {busy ? 'надсилаємо…' : 'надіслати посилання'}
          </Button>
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="m-0 rounded-ui bg-green/35 px-3.5 py-3 text-sm leading-relaxed text-text">
            Посилання для входу надіслано на <strong>{sentTo}</strong>. Відкрий його на цьому телефоні.
          </p>
          <form onSubmit={onVerify} className="flex flex-col gap-3" noValidate>
            <label htmlFor="login-code" className="text-[13px] text-muted">
              або введи 6-значний код з листа
            </label>
            <input
              id="login-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className={`${INPUT} text-center font-mono tracking-[0.4em]`}
              aria-describedby={error ? 'login-error' : undefined}
            />
            <Button type="submit" fullWidth disabled={busy || code.length !== 6}>
              увійти
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSentTo(null);
                setCode('');
                setError(null);
              }}
            >
              інша пошта
            </Button>
          </form>
        </div>
      )}

      {error && (
        <p id="login-error" role="alert" className="m-0 text-sm text-warn">
          {SIGN_IN_ERRORS[error]}
        </p>
      )}

      <p className="m-0 text-center text-xs text-muted">Доступ лише за запрошенням менеджера.</p>
    </main>
  );
}
