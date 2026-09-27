import { render, screen } from '@testing-library/react';
import ProgressBar from './ProgressBar';

describe('ProgressBar', () => {
  it('exposes its value', () => {
    render(<ProgressBar value={120} max={250} label="до рівня 4" />);
    const bar = screen.getByRole('progressbar', { name: 'до рівня 4' });
    expect(bar).toHaveAttribute('aria-valuenow', '120');
    expect((bar.firstChild as HTMLElement).style.width).toBe('48%');
  });

  it('clamps out-of-range values', () => {
    render(<ProgressBar value={400} max={250} label="xp" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '250');
  });
});
