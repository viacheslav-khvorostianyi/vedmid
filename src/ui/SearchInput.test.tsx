import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import SearchInput from './SearchInput';

function Harness() {
  const [q, setQ] = useState('');
  return <SearchInput id="q" value={q} onChange={setQ} />;
}

describe('SearchInput', () => {
  it('has a label and the default placeholder', () => {
    render(<Harness />);
    const input = screen.getByRole('searchbox', { name: 'пошук' });
    expect(input).toHaveAttribute('placeholder', 'пошук страви, вина, алергену…');
  });

  it('shows a clear button only when there is text, and clears on click', async () => {
    render(<Harness />);
    expect(screen.queryByRole('button', { name: 'очистити пошук' })).not.toBeInTheDocument();
    await userEvent.type(screen.getByRole('searchbox'), 'борщ');
    expect(screen.getByRole('searchbox')).toHaveValue('борщ');
    await userEvent.click(screen.getByRole('button', { name: 'очистити пошук' }));
    expect(screen.getByRole('searchbox')).toHaveValue('');
  });
});
