import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Chip from './Chip';

describe('Chip', () => {
  it('exposes toggle state and the filled style when selected', () => {
    render(<Chip selected>їжа</Chip>);
    const chip = screen.getByRole('button', { name: 'їжа' });
    expect(chip).toHaveAttribute('aria-pressed', 'true');
    expect(chip.className).toContain('bg-green');
  });

  it('is outlined when not selected', () => {
    render(<Chip>вино</Chip>);
    const chip = screen.getByRole('button', { name: 'вино' });
    expect(chip).toHaveAttribute('aria-pressed', 'false');
    expect(chip.className).toContain('border-line');
    expect(chip.className).toContain('min-h-11');
  });

  it('uses aria-selected as a tab', () => {
    render(
      <Chip role="tab" selected>
        склад
      </Chip>,
    );
    expect(screen.getByRole('tab', { name: 'склад' })).toHaveAttribute('aria-selected', 'true');
  });

  it('does not fire when disabled', async () => {
    const onClick = vi.fn();
    render(
      <Chip disabled onClick={onClick}>
        пиво
      </Chip>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'пиво' }));
    expect(onClick).not.toHaveBeenCalled();
  });
});
