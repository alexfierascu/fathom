import { useState } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';

import { GlobalSearch } from './GlobalSearch';

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname + location.search}</div>;
}

function Harness() {
  const [query, setQuery] = useState('');
  return (
    <MemoryRouter>
      <GlobalSearch query={query} onQueryChange={setQuery} />
      <Routes>
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('GlobalSearch', () => {
  it('shows grouped results with type labels and highlighting as the user types', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByRole('combobox'), 'denmark');

    expect(screen.getByText('Countries')).toBeInTheDocument();
    expect(screen.getByText('Straits')).toBeInTheDocument();
    const option = screen.getByRole('option', { name: /Denmark Country/ });
    expect(option).toBeInTheDocument();
    expect(option.querySelector('mark')?.textContent).toBe('Denmark');
  });

  it('navigates with arrow keys and Enter', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByRole('combobox'), 'mediterr');
    await user.keyboard('{ArrowDown}{Enter}');

    expect(screen.getByTestId('location')).toHaveTextContent('/water-bodies/mediterranean-sea');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('opens the first result on Enter without arrow selection', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByRole('combobox'), 'gibraltar');
    await user.keyboard('{Enter}');

    expect(screen.getByTestId('location')).toHaveTextContent('/straits/gibraltar');
  });

  it('closes on Escape, then clears on a second Escape', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByRole('combobox');

    await user.type(input, 'spain');
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(input).toHaveValue('spain');

    await user.keyboard('{Escape}');
    expect(input).toHaveValue('');
  });

  it('shows the no-results state', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByRole('combobox'), 'atlantis');
    expect(screen.getByText(/Nothing charted for/)).toBeInTheDocument();
  });

  it('navigates region results to the filtered homepage', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByRole('combobox'), 'east asia');
    await user.click(screen.getByRole('option', { name: /East Asia & Oceania Region/ }));

    expect(screen.getByTestId('location')).toHaveTextContent('/regions/east-asia-oceania');
  });
});
