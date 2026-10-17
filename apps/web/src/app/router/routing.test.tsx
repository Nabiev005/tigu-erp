import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { db } from '../../mocks/data/db';
import ky from '../../shared/i18n/ky.json';
import { renderApp } from '../../test/renderApp';

function signInAs(userId: string) {
  db.setSession(userId);
}

describe('route guards', () => {
  it('sends anonymous users from /admin to /login', async () => {
    const { router } = renderApp('/admin/orders');
    expect(await screen.findByRole('heading', { name: ky.auth.login.title })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
  });

  it('shows OWNER the dashboard with every admin section in the sidebar', async () => {
    signInAs('u-owner');
    renderApp('/admin');
    expect(await screen.findByRole('heading', { name: ky.nav.dashboard })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: ky.nav.payroll })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: ky.nav.settings })).toBeInTheDocument();
  });

  it('moves FOREMAN from /admin (no dashboard access) to the first allowed section', async () => {
    signInAs('u-foreman');
    const { router } = renderApp('/admin');
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/orders'));
    expect(screen.queryByRole('link', { name: ky.nav.payroll })).not.toBeInTheDocument();
  });

  it('keeps SEWER out of payroll and sends them to the scan screen', async () => {
    signInAs('u-sewer');
    const { router } = renderApp('/admin/payroll');
    await waitFor(() => expect(router.state.location.pathname).toBe('/w/scan'));
    expect(await screen.findByRole('link', { name: ky.nav.earnings })).toBeInTheDocument();
  });

  it('redirects signed-in users away from /login', async () => {
    signInAs('u-accountant');
    const { router } = renderApp('/login');
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/payroll'));
  });

  it('shows stage-2 sections greyed out instead of as links', async () => {
    signInAs('u-owner');
    renderApp('/admin');
    await screen.findByRole('heading', { name: ky.nav.dashboard });
    expect(
      screen.queryByRole('link', { name: new RegExp(ky.nav.warehouse) }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText(ky.common.stage.replace('{{stage}}', '2')).length).toBeGreaterThan(
      0,
    );
  });
});
