import { test, expect } from '../src/fixtures/test-fixtures.js';
import { env, hasMerchantCreds } from '../src/config/env.js';

test.describe('Logout', () => {
  test.skip(!hasMerchantCreds, 'Set MERCHANT_PHONE / MERCHANT_PASSWORD in .env');

  test.beforeEach(async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.login(env.merchant.phone, env.merchant.password);
    await page.goto('/delivery'); // the account menu lives in the Delivery app shell
  });

  test('signs out through the confirmation dialog and returns to login @smoke', async ({ appShell, page }) => {
    await appShell.openSignOutDialog();
    const response = await appShell.confirmLogout();

    expect(response.status(), 'POST /auth/logout').toBe(200);
    await expect(page).toHaveURL(/\/login/);
  });

  test('cancelling the sign-out dialog keeps the session active', async ({ appShell, page }) => {
    await appShell.openSignOutDialog();
    await appShell.cancelLogout();

    await expect(page).not.toHaveURL(/\/login/);
  });
});
