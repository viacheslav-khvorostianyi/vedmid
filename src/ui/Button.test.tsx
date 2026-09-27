import { render, screen } from '@testing-library/react';
import Button from './Button';

describe('Button', () => {
  it.each([
    ['ok', 'bg-green'],
    ['no', 'bg-warn-bg'],
    ['ghost', 'border-line'],
  ] as const)('%s variant uses its tokens', (variant, cls) => {
    render(<Button variant={variant}>знаю</Button>);
    expect(screen.getByRole('button', { name: 'знаю' }).className).toContain(cls);
  });

  it('is at least 48px tall at md size and type=button by default', () => {
    render(<Button>не знаю</Button>);
    const button = screen.getByRole('button', { name: 'не знаю' });
    expect(button.className).toContain('min-h-12');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('can be disabled', () => {
    render(<Button disabled>зберегти</Button>);
    expect(screen.getByRole('button', { name: 'зберегти' })).toBeDisabled();
  });
});
