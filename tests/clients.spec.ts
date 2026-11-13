import { test, expect } from '../src/fixtures/test-fixtures.js';
import { env, hasMerchantCreds } from '../src/config/env.js';
import { ClientsPage } from '../src/pages/clients.page.js';

test.describe('Clients', () => {
  test.skip(!hasMerchantCreds, 'Set MERCHANT_PHONE / MERCHANT_PASSWORD in .env');

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(env.merchant.phone, env.merchant.password);
  });

  test('lists clients with name, date and phone @smoke', async ({ clientsPage, page }) => {
    const response = await clientsPage.open();
    expect(response.status(), 'GET /vendors/clients').toBe(200);
    const body = await response.json();

    await expect(clientsPage.heading).toBeVisible();
    for (const column of ClientsPage.COLUMNS) {
      await expect(clientsPage.column(column)).toBeVisible();
    }
    await expect(clientsPage.dateFilter).toBeVisible();
    await expect(clientsPage.search).toBeVisible();

    // When the account has clients, the table renders rows with phone numbers.
    if (body.data?.length) {
      expect(await clientsPage.rows.count(), 'client rows').toBeGreaterThan(0);
      await expect(page.getByText(/\+998/).first()).toBeVisible();
    }
  });
});
