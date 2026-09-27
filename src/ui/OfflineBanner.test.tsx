import { act, render, screen } from '@testing-library/react';
import OfflineBanner, { OFFLINE_BANNER_DELAY_MS } from './OfflineBanner';

function goOffline(value: boolean) {
  Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => !value });
  window.dispatchEvent(new Event(value ? 'offline' : 'online'));
}

describe('OfflineBanner', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    goOffline(false);
  });

  it('appears only after 2 s offline and hides when back online', () => {
    render(<OfflineBanner />);
    act(() => goOffline(true));
    expect(screen.queryByText(/офлайн/)).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(OFFLINE_BANNER_DELAY_MS));
    expect(screen.getByText('офлайн — показуємо збережене меню')).toBeInTheDocument();
    act(() => goOffline(false));
    expect(screen.queryByText(/офлайн/)).not.toBeInTheDocument();
  });

  it('does not flash for a short drop', () => {
    render(<OfflineBanner />);
    act(() => goOffline(true));
    act(() => vi.advanceTimersByTime(1000));
    act(() => goOffline(false));
    act(() => vi.advanceTimersByTime(OFFLINE_BANNER_DELAY_MS));
    expect(screen.queryByText(/офлайн/)).not.toBeInTheDocument();
  });
});
