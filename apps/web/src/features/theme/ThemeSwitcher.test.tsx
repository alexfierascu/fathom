import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ThemeSwitcher } from './ThemeSwitcher';

describe('ThemeSwitcher', () => {
  it('opens a menu listing every theme with the active one checked', async () => {
    const user = userEvent.setup();
    render(<ThemeSwitcher theme="abyss" onChange={() => undefined} />);

    const trigger = screen.getByRole('button', { name: 'Theme: Abyss' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);
    expect(screen.getAllByRole('menuitemradio')).toHaveLength(4);
    expect(screen.getByRole('menuitemradio', { name: 'Abyss', checked: true })).toBeInTheDocument();
    expect(
      screen.getByRole('menuitemradio', { name: 'Parchment', checked: false }),
    ).toBeInTheDocument();
  });

  it('reports the chosen theme and closes the menu', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ThemeSwitcher theme="abyss" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Theme: Abyss' }));
    await user.click(screen.getByRole('menuitemradio', { name: 'Midnight' }));

    expect(onChange).toHaveBeenCalledWith('midnight');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes on Escape without changing the theme', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ThemeSwitcher theme="abyss" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Theme: Abyss' }));
    await user.keyboard('{Escape}');

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
