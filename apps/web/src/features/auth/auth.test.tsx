import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DEMO_CODE, DEMO_PASSWORD, DEMO_PIN } from '../../mocks/data/db';
import ky from '../../shared/i18n/ky.json';
import { renderApp } from '../../test/renderApp';

describe('login (1.1)', () => {
  it('logs a manager in with password + 2FA code and opens their home', async () => {
    const { user, router } = renderApp('/login');
    await user.type(await screen.findByLabelText(ky.auth.login.phone), '555000001');
    await user.type(screen.getByLabelText(ky.auth.login.password), DEMO_PASSWORD);
    await user.click(screen.getByRole('button', { name: ky.auth.login.submit }));

    await user.type(await screen.findByLabelText(ky.auth.twoFactor.code), DEMO_CODE);
    await user.click(screen.getByRole('button', { name: ky.auth.twoFactor.submit }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/admin'));
    expect(await screen.findByRole('heading', { name: ky.nav.dashboard })).toBeInTheDocument();
  });

  it('shows a translated error for a wrong password', async () => {
    const { user } = renderApp('/login');
    await user.type(await screen.findByLabelText(ky.auth.login.phone), '555000001');
    await user.type(screen.getByLabelText(ky.auth.login.password), 'wrong-password');
    await user.click(screen.getByRole('button', { name: ky.auth.login.submit }));
    expect(await screen.findByText(ky.errors.INVALID_CREDENTIALS)).toBeInTheDocument();
  });

  it('validates the phone on the client', async () => {
    const { user } = renderApp('/login');
    await user.type(await screen.findByLabelText(ky.auth.login.phone), '555');
    await user.click(screen.getByRole('button', { name: ky.auth.login.submit }));
    expect(await screen.findByText(ky.validation.phone)).toBeInTheDocument();
  });
});

describe('PIN (1.2)', () => {
  async function openPin() {
    const app = renderApp('/login?tab=sewer');
    await app.user.type(await screen.findByLabelText(ky.auth.login.phone), '555000005');
    await app.user.click(screen.getByRole('button', { name: ky.auth.login.next }));
    await screen.findByRole('heading', { name: ky.auth.pin.title });
    return app;
  }

  it('logs a sewer in with phone + PIN and opens the scan screen', async () => {
    const { user, router } = await openPin();
    await user.keyboard(DEMO_PIN);
    await waitFor(() => expect(router.state.location.pathname).toBe('/w/scan'));
  });

  it('locks login after 5 wrong PINs', async () => {
    const { user } = await openPin();
    for (let attempt = 1; attempt <= 4; attempt++) {
      await user.keyboard('0000');
      expect(
        await screen.findByText(ky.auth.pin.attemptsLeft.replace('{{count}}', String(5 - attempt))),
      ).toBeInTheDocument();
    }
    await user.keyboard('0000');
    expect(await screen.findByText(/^Кирүү бөгөттөлдү\. 1[45]:\d\d кийин/)).toBeInTheDocument();
    for (const key of ['1', '2']) expect(screen.getByRole('button', { name: key })).toBeDisabled();
  });
});

describe('register (6.2)', () => {
  it('creates a company, confirms the phone and can skip step 3', async () => {
    const { user, router } = renderApp('/register');
    await user.type(await screen.findByLabelText(ky.auth.register.companyName), 'Жаңы цех');
    await user.type(screen.getByLabelText(ky.auth.register.employeesCount), '25');
    await user.type(screen.getByLabelText(ky.auth.register.ownerFullName), 'Асан Үсөнов');
    await user.type(screen.getByLabelText(ky.auth.register.phone), '700123456');
    await user.type(screen.getByLabelText(ky.auth.register.password), 'secret123');
    await user.click(screen.getByLabelText(ky.auth.register.acceptTerms));
    await user.click(screen.getByRole('button', { name: ky.auth.register.submit }));

    await user.type(await screen.findByLabelText(ky.auth.otp.code), DEMO_CODE);
    await user.click(screen.getByRole('button', { name: ky.auth.register.verifySubmit }));

    await screen.findByRole('heading', { name: ky.auth.register.startTitle });
    await user.click(screen.getByRole('button', { name: ky.auth.register.skip }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin'));
  });

  it('requires accepting the terms and rejects a taken phone', async () => {
    const { user } = renderApp('/register');
    await user.type(await screen.findByLabelText(ky.auth.register.companyName), 'Цех');
    await user.type(screen.getByLabelText(ky.auth.register.employeesCount), '10');
    await user.type(screen.getByLabelText(ky.auth.register.ownerFullName), 'Бакыт');
    await user.type(screen.getByLabelText(ky.auth.register.phone), '555000001');
    await user.type(screen.getByLabelText(ky.auth.register.password), 'secret123');
    await user.click(screen.getByRole('button', { name: ky.auth.register.submit }));
    expect(await screen.findByText(ky.validation.terms)).toBeInTheDocument();

    await user.click(screen.getByLabelText(ky.auth.register.acceptTerms));
    await user.click(screen.getByRole('button', { name: ky.auth.register.submit }));
    expect(await screen.findByText(ky.errors.PHONE_TAKEN)).toBeInTheDocument();
  });
});
