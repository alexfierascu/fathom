import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import { Breadcrumbs } from './Breadcrumbs';

describe('Breadcrumbs', () => {
  it('renders links for navigable crumbs and marks the current page', () => {
    render(
      <MemoryRouter>
        <Breadcrumbs
          items={[{ label: 'Home', to: '/' }, { label: 'Europe' }, { label: 'Bosporus' }]}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByText('Bosporus')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('Europe')).not.toHaveAttribute('aria-current');
  });
});
