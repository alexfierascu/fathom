import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { Image } from '@fathom/data';

import { MediaGallery } from './MediaGallery';

const fixtures: Image[] = [
  {
    id: 'test-hero',
    file: 'straits/test-hero.jpg',
    license: 'CC BY-SA 4.0',
    credit: 'A. Photographer',
    alt: 'Aerial view of a strait',
    role: 'representative',
    caption: 'The strait from above',
    depicts: [{ type: 'strait', id: 'gibraltar' }],
  },
  {
    id: 'test-second',
    file: 'straits/test-second.jpg',
    license: 'CC BY 4.0',
    credit: 'B. Sailor',
    alt: 'A ferry mid-crossing',
    depicts: [{ type: 'strait', id: 'gibraltar' }],
  },
];

describe('MediaGallery', () => {
  it('renders nothing without images', () => {
    const { container } = render(<MediaGallery images={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a lazy, responsive hero with always-visible attribution', () => {
    render(<MediaGallery images={fixtures} />);
    const hero = screen.getByAltText('Aerial view of a strait');
    expect(hero).toHaveAttribute('loading', 'lazy');
    expect(hero).toHaveAttribute(
      'srcset',
      expect.stringContaining('/media/480/straits/test-hero.jpg'),
    );
    expect(screen.getByText('A. Photographer · CC BY-SA 4.0')).toBeInTheDocument();
  });

  it('opens the fullscreen viewer, navigates, and closes on Escape', async () => {
    const user = userEvent.setup();
    render(<MediaGallery images={fixtures} />);

    await user.click(screen.getByRole('button', { name: /Aerial view/ }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText(/The strait from above/)).toBeInTheDocument();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByText('B. Sailor · CC BY 4.0')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
