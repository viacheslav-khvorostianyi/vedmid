import { act, render, screen } from '@testing-library/react';
import { TOAST_DURATION_MS, ToastProvider, useToast } from './Toast';

function Trigger() {
  const toast = useToast();
  return (
    <button type="button" onClick={() => (toast('Збережено'), toast('Новий рівень'))}>
      go
    </button>
  );
}

describe('Toast', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('shows queued toasts one at a time for 3 s each', () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    act(() => screen.getByRole('button').click());
    const region = screen.getByRole('status');
    expect(region).toHaveTextContent('Збережено');
    expect(region).not.toHaveTextContent('Новий рівень');
    act(() => vi.advanceTimersByTime(TOAST_DURATION_MS));
    expect(region).toHaveTextContent('Новий рівень');
    act(() => vi.advanceTimersByTime(TOAST_DURATION_MS));
    expect(region).toBeEmptyDOMElement();
  });

  it('throws outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Trigger />)).toThrow('useToast must be used inside <ToastProvider>');
  });
});
