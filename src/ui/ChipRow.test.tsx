import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import ChipRow from './ChipRow';

const OPTIONS = [
  { value: 'food', label: 'їжа' },
  { value: 'wine', label: 'вино' },
  { value: 'spirits', label: 'міцні' },
] as const;

function Harness({ onChange }: { onChange?: (v: string) => void }) {
  const [value, setValue] = useState<(typeof OPTIONS)[number]['value']>('food');
  return (
    <ChipRow
      id="cat"
      label="категорії"
      options={OPTIONS}
      value={value}
      onChange={(v) => {
        setValue(v);
        onChange?.(v);
      }}
    />
  );
}

describe('ChipRow', () => {
  it('renders a labelled tab list with one selected tab', () => {
    render(<Harness />);
    expect(screen.getByRole('tablist', { name: 'категорії' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'їжа' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'вино' })).toHaveAttribute('tabindex', '-1');
  });

  it('selects on click', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await userEvent.click(screen.getByRole('tab', { name: 'вино' }));
    expect(onChange).toHaveBeenCalledWith('wine');
    expect(screen.getByRole('tab', { name: 'вино' })).toHaveAttribute('aria-selected', 'true');
  });

  it('moves selection and focus with arrow keys, Home and End (wrapping)', async () => {
    render(<Harness />);
    screen.getByRole('tab', { name: 'їжа' }).focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'міцні' })).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'їжа' })).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'вино' })).toHaveFocus();
    await userEvent.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'міцні' })).toHaveAttribute('aria-selected', 'true');
  });
});
