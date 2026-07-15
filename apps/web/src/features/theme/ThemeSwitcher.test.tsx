import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ThemeSwitcher } from './ThemeSwitcher';

describe('ThemeSwitcher', () => {
  it('renders one swatch per theme with the active one pressed', () => {
    render(<ThemeSwitcher theme="abyss" onChange={() => undefined} />);

    const swatches = screen.getAllByRole('button');
    expect(swatches).toHaveLength(4);
    expect(screen.getByRole('button', { name: 'Abyss theme', pressed: true })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Parchment theme', pressed: false }),
    ).toBeInTheDocument();
  });

  it('reports the chosen theme', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ThemeSwitcher theme="abyss" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Midnight theme' }));
    expect(onChange).toHaveBeenCalledWith('midnight');
  });
});
