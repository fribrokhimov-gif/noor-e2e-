import { test, expect } from '../src/fixtures/test-fixtures.js';
import { env, hasMerchantCreds } from '../src/config/env.js';

test.describe('Login', () => {
  test.skip(!hasMerchantCreds, 'Set MERCHANT_PHONE / MERCHANT_PASSWORD in .env');

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('signs in with valid credentials and lands on the home page @smoke', async ({ loginPage, page }) => {
    // LoginPage.login asserts the POST /auth/merchant 200 + tokens, then waits for /welcome.
    await loginPage.login(env.merchant.phone, env.merchant.password);
    await expect(page).toHaveURL(/\/welcome/);
  });

  test('rejects an incorrect password and stays on the login page', async ({ loginPage, page }) => {
    await loginPage.fillCredentials(env.merchant.phone, 'Wrong-Password-123');
    const response = await loginPage.submitAndCaptureLogin();

    expect(response.status(), 'HTTP status').toBe(401);
    expect((await response.json()).error.code, 'error code').toBe(5001);
    await expect(page).toHaveURL(/\/login/);
    await expect(loginPage.errorMessage()).toBeVisible();
  });

  test('treats an unknown phone like a wrong password (no account enumeration)', async ({ loginPage, page }) => {
    await loginPage.fillCredentials('+998000000001', 'Whatever-123');
    const response = await loginPage.submitAndCaptureLogin();

    expect(response.status()).toBe(401);
    expect((await response.json()).error.code, 'same code as a wrong password').toBe(5001);
    await expect(page).toHaveURL(/\/login/);
  });
});
