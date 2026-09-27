import { classifySignInError } from './api';
import { safeNext } from './redirect';

describe('safeNext', () => {
  it.each([
    ['/cards', '/cards'],
    ['/games/quiz?x=1', '/games/quiz?x=1'],
    [null, '/menu'],
    ['', '/menu'],
    ['https://evil.example', '/menu'],
    ['//evil.example', '/menu'],
    ['/\\evil.example', '/menu'],
    ['/login', '/menu'],
    ['/login?next=/x', '/menu'],
    ['/', '/menu'],
  ])('%s → %s', (input, expected) => {
    expect(safeNext(input)).toBe(expected);
  });
});

describe('classifySignInError', () => {
  it.each([
    [{ message: 'Signups not allowed for otp', code: 'otp_disabled', status: 422 }, 'unknown_email'],
    [{ message: 'Signups not allowed for this instance', status: 422 }, 'unknown_email'],
    [
      { message: 'Unable to validate email address: invalid format', code: 'validation_failed', status: 400 },
      'invalid_email',
    ],
    [
      { message: 'Email rate limit exceeded', code: 'over_email_send_rate_limit', status: 429 },
      'rate_limited',
    ],
    [{ message: 'Token has expired or is invalid', code: 'otp_expired', status: 403 }, 'invalid_code'],
    [{ message: 'Failed to fetch' }, 'network'],
    [{ message: 'Database error', status: 500 }, 'other'],
  ])('%o → %s', (error, kind) => {
    expect(classifySignInError(error)).toBe(kind);
  });
});
