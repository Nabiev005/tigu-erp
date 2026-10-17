import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ky from '../../shared/i18n/ky.json';
import { renderApp } from '../../test/renderApp';

describe('landing (6.1)', () => {
  it('renders the hero and submits a lead via POST /leads', async () => {
    const { user } = renderApp('/');
    expect(
      await screen.findByRole('heading', { level: 1, name: ky.landing.hero.title }),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText(ky.landing.lead.name), 'Айбек');
    await user.type(screen.getByLabelText(ky.landing.lead.phone), '555987654');
    await user.type(screen.getByLabelText(ky.landing.lead.employeesCount), '40');
    await user.click(screen.getByRole('button', { name: ky.landing.lead.submit }));

    expect(await screen.findByText(ky.landing.lead.success)).toBeInTheDocument();
  });
});
