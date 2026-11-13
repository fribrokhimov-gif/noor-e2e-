import { test, expect } from '../src/fixtures/test-fixtures.js';
import { env, hasMerchantCreds } from '../src/config/env.js';

test.describe('Reviews (Отзывы)', () => {
  test.skip(!hasMerchantCreds, 'Set MERCHANT_PHONE / MERCHANT_PASSWORD in .env');

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(env.merchant.phone, env.merchant.password);
  });

  test('loads ratings and shows heading or empty state @smoke', async ({ reviewsPage }) => {
    const response = await reviewsPage.open();
    expect(response.status(), 'GET /ratings').toBe(200);
    const body = await response.json();

    await expect(reviewsPage.heading).toBeVisible();

    if (body.count === 0 || body.data?.length === 0) {
      await expect(reviewsPage.emptyState).toBeVisible();
    }
  });
});
