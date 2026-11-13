import { test, expect } from '../src/fixtures/test-fixtures.js';
import { env, hasMerchantCreds } from '../src/config/env.js';

test.describe('Pricing (Tariffs)', () => {
  test.skip(!hasMerchantCreds, 'Set MERCHANT_PHONE / MERCHANT_PASSWORD in .env');

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(env.merchant.phone, env.merchant.password);
  });

  test('shows the tariff rate card and loads pricing @smoke', async ({ pricingPage, page }) => {
    const response = await pricingPage.open();
    expect(response.status(), 'GET /vendors/pricing').toBe(200);
    const pricing = await response.json();

    await expect(pricingPage.heading).toBeVisible();
    await expect(pricingPage.demandCoefficient).toBeVisible();
    await expect(pricingPage.minimumCost).toBeVisible();
    await expect(pricingPage.newPoint).toBeVisible();
    await expect(pricingPage.cancelPrice).toBeVisible();

    // API → UI: the tariff name from the response is rendered.
    if (pricing.tariff?.name) {
      await expect(page.getByText(pricing.tariff.name, { exact: true }).first()).toBeVisible();
    }
    // Prices render in sum.
    await expect(page.getByText(/сум/).first()).toBeVisible();
  });
});
