import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import { loadStrait } from '@fathom/data';

import { ConnectsLine } from './ConnectsLine';

describe('ConnectsLine', () => {
  it('links both water bodies for "A ↔ B" connects values', () => {
    render(
      <MemoryRouter>
        <ConnectsLine strait={loadStrait('gibraltar')} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Atlantic Ocean' })).toHaveAttribute(
      'href',
      '/water-bodies/atlantic-ocean',
    );
    expect(screen.getByRole('link', { name: 'Mediterranean Sea' })).toHaveAttribute(
      'href',
      '/water-bodies/mediterranean-sea',
    );
  });

  it('renders prose connects values as plain text', () => {
    render(
      <MemoryRouter>
        <ConnectsLine strait={loadStrait('solent')} />
      </MemoryRouter>,
    );
    expect(
      screen.getByText('Separates the Isle of Wight from mainland England'),
    ).toBeInTheDocument();
    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });
});
