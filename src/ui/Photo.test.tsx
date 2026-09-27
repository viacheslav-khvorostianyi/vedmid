import { render, screen } from '@testing-library/react';
import Photo from './Photo';

describe('Photo', () => {
  it('shows the placeholder when there is no photo', () => {
    render(<Photo alt="фото подачі борщу" />);
    expect(screen.getByRole('img', { name: 'фото подачі борщу' })).toHaveTextContent('фото подачі');
  });

  it('lazy-loads the image inside a fixed-ratio box', () => {
    render(<Photo src="/borsch.webp" alt="борщ" aspect="video" />);
    const img = screen.getByRole('img', { name: 'борщ' });
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img.parentElement?.className).toContain('aspect-video');
  });
});
