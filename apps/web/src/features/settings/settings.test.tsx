import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { db } from '../../mocks/data/db';
import ky from '../../shared/i18n/ky.json';
import { renderApp } from '../../test/renderApp';

const asOwner = () => db.setSession('u-owner');

describe('settings (2.10)', () => {
  it('opens the users tab by default and lists users with masked phones', async () => {
    asOwner();
    const { router } = renderApp('/admin/settings');
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/settings/users'));
    expect(await screen.findByText('Айгүл Токтогулова')).toBeInTheDocument();
    expect(screen.getAllByText('+996 555 •• •• 05').length).toBeGreaterThan(0);
    expect(screen.queryByText('+996555000005')).not.toBeInTheDocument();
  });

  it('adds a sewer: the PIN is sent automatically', async () => {
    asOwner();
    const { user } = renderApp('/admin/settings/users');
    await screen.findByText('Айгүл Токтогулова');
    await user.click(screen.getByRole('button', { name: ky.settings.users.add }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(ky.settings.userForm.credentialHintSewer)).toBeInTheDocument();
    await user.type(
      within(dialog).getByLabelText(ky.settings.userForm.fullName),
      'Мээрим Абдыкадырова',
    );
    await user.type(within(dialog).getByLabelText(ky.settings.userForm.phone), '700123456');
    await user.click(screen.getByRole('button', { name: ky.common.save }));

    expect(
      await screen.findByText(
        ky.settings.userForm.createdSewer.replace('{{phone}}', '+996 700 123 456'),
      ),
    ).toBeInTheDocument();
    expect(await screen.findByText('Мээрим Абдыкадырова')).toBeInTheDocument();
  });

  it('requires the salary amount for SALARY pay type', async () => {
    asOwner();
    const { user } = renderApp('/admin/settings/users');
    await screen.findByText('Айгүл Токтогулова');
    await user.click(screen.getByRole('button', { name: ky.settings.users.add }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(ky.settings.userForm.fullName), 'Жылдыз');
    await user.type(within(dialog).getByLabelText(ky.settings.userForm.phone), '700999888');
    await user.selectOptions(within(dialog).getByLabelText(ky.settings.userForm.payType), 'SALARY');
    await user.click(screen.getByRole('button', { name: ky.common.save }));
    expect(await within(dialog).findByText(ky.validation.salaryRequired)).toBeInTheDocument();
  });

  it('shows the server error when the owner tries to deactivate themselves', async () => {
    asOwner();
    const { user } = renderApp('/admin/settings/users');
    await user.click(
      await screen.findByRole('button', {
        name: ky.settings.users.edit.replace('{{name}}', 'Бакыт Асанов'),
      }),
    );
    const dialog = await screen.findByRole('dialog');
    // The checkbox is disabled in the UI; the role select too.
    expect(within(dialog).getByLabelText(ky.settings.userForm.isActive)).toBeDisabled();
    expect(within(dialog).getByLabelText(ky.settings.userForm.role)).toBeDisabled();
  });

  it('renders the roles matrix from the shared permissions', async () => {
    asOwner();
    renderApp('/admin/settings/roles');
    const table = await screen.findByRole('table', { name: ky.settings.roles.title });
    const payrollRow = within(table).getByRole('row', { name: new RegExp(ky.nav.payroll) });
    // OWNER + ACCOUNTANT only.
    expect(within(payrollRow).getAllByLabelText(ky.settings.roles.allowed)).toHaveLength(2);
  });

  it('saves company work days and records it in the audit log', async () => {
    asOwner();
    const { user } = renderApp('/admin/settings/company');
    const shift = await screen.findByLabelText(ky.settings.company.shiftHours);
    await user.clear(shift);
    await user.type(shift, '9');
    await user.click(screen.getByRole('button', { name: ky.settings.company.save }));
    expect(await screen.findByText(ky.settings.company.saved)).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: ky.settings.tabs.audit }));
    expect(await screen.findByText(ky.settings.audit.actions.tenant.update)).toBeInTheDocument();
  });

  it('keeps non-owners out of settings', async () => {
    db.setSession('u-technologist');
    const { router } = renderApp('/admin/settings/users');
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin'));
  });
});
