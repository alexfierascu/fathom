import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import { loadStrait } from '@fathom/data';

import { StraitPager } from './StraitPager';

describe('StraitPager', () => {
  it('links to both neighbors when present', () => {
    render(
      <MemoryRouter>
        <StraitPager previous={loadStrait('gibraltar')} next={loadStrait('solent')} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: '← Strait of Gibraltar' })).toHaveAttribute(
      'href',
      '/straits/gibraltar',
    );
    expect(screen.getByRole('link', { name: 'The Solent →' })).toHaveAttribute(
      'href',
      '/straits/solent',
    );
  });

  it('omits links at the ends of the order', () => {
    render(
      <MemoryRouter>
        <StraitPager previous={null} next={null} />
      </MemoryRouter>,
    );
    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });
});
