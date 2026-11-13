import { test, expect } from '../src/fixtures/test-fixtures.js';
import { env, hasMerchantCreds } from '../src/config/env.js';
import { MerchantApi } from '../src/api/merchant-api.js';

test.describe('Employees (Staff)', () => {
  test.skip(!hasMerchantCreds, 'Set MERCHANT_PHONE / MERCHANT_PASSWORD in .env');

  let phone = '';
  const suffix = Date.now().toString().slice(-6);

  test.beforeEach(async ({ loginPage, staffPage }) => {
    await loginPage.goto();
    await loginPage.login(env.merchant.phone, env.merchant.password);
    await staffPage.goto();
    phone = MerchantApi.virtualPhone();
  });

  // Safety net: if a test fails before the UI delete, remove the employee via the API.
  test.afterEach(async ({ merchantApi }) => {
    if (phone) await merchantApi.deleteEmployeeByPhone(phone);
  });

  test('adds a manager, shows them in the list, then deletes them @smoke', async ({ staffPage }) => {
    const lastName = `E2E${suffix}`;
    const firstName = 'Manager';
    const fullName = `${lastName} ${firstName}`;

    await staffPage.openAddForm();
    await staffPage.fillEmployee({ lastName, firstName, phone, role: 'manager' });

    const addResponse = await staffPage.save();
    expect(addResponse.status(), 'POST /merchant-employees').toBe(200);
    const employee = (await addResponse.json()).data.employee;
    expect(employee.phone).toBe(phone);
    expect(employee.role).toBe('manager');

    await expect(staffPage.addedToast).toBeVisible();
    await expect(staffPage.row(fullName)).toBeVisible();

    const deleteResponse = await staffPage.deleteEmployee(fullName);
    expect(deleteResponse.status(), 'DELETE /merchant-employees/{id}').toBe(200);
    await expect(staffPage.row(fullName)).toBeHidden();
    phone = ''; // deleted — skip the afterEach safety net
  });

  test('adds a cashier', async ({ staffPage }) => {
    await staffPage.openAddForm();
    await staffPage.fillEmployee({ lastName: `E2E${suffix}C`, firstName: 'Cashier', phone, role: 'cashier' });

    const response = await staffPage.save();
    expect(response.status()).toBe(200);
    expect((await response.json()).data.employee.role, 'role').toBe('cashier');
    // afterEach removes it by phone
  });

  test('rejects an employee with no phone', async ({ staffPage }) => {
    await staffPage.openAddForm();
    await staffPage.fillEmployee({ lastName: 'NoPhone', firstName: 'QA', phone: '', role: 'manager' });
    // The form should not create anyone; the add-success toast must not appear.
    await staffPage.saveButton.click();
    await expect(staffPage.addedToast).toBeHidden();
    phone = ''; // nothing created
  });
});
