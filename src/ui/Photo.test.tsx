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
    expect(screen.queryByText(/ілюстративне фото/)).not.toBeInTheDocument();
  });

  it('labels a stock photo as illustrative and links to its source', () => {
    render(
      <Photo
        src="/borsch.webp"
        alt="борщ"
        credit={{ text: 'Jane Doe, CC BY 2.0', url: 'https://example.org/p/1' }}
      />,
    );
    expect(screen.getByRole('figure')).toHaveTextContent('ілюстративне фото · Jane Doe, CC BY 2.0');
    expect(screen.getByRole('link', { name: 'Jane Doe, CC BY 2.0' })).toHaveAttribute(
      'href',
      'https://example.org/p/1',
    );
  });
});
