import { test, expect } from '../src/fixtures/test-fixtures.js';
import { env, hasMerchantCreds, runGeocoderTests, addressQuery } from '../src/config/env.js';

test.describe('Addresses (Branches)', () => {
  test.skip(!hasMerchantCreds, 'Set MERCHANT_PHONE / MERCHANT_PASSWORD in .env');

  let createdName = '';

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(env.merchant.phone, env.merchant.password);
  });

  // Safety net: remove the address by name if a test left it behind.
  test.afterEach(async ({ merchantApi }) => {
    if (createdName) await merchantApi.deleteAddressByName(createdName);
    createdName = '';
  });

  test('an address shows in the list and can be deleted through the UI @smoke', async ({ branchesPage, merchantApi }) => {
    const name = `QA-E2E-${Date.now()}`;
    // Seed via the API (UI creation needs the live geocoder — see the test below).
    await merchantApi.createAddress(name);
    createdName = name;

    await branchesPage.goto();
    await expect(branchesPage.card(name)).toBeVisible();

    const response = await branchesPage.deleteAddress(name);
    expect(response.status(), 'DELETE /vendors/locations/{id}').toBe(204);
    await expect(branchesPage.card(name)).toBeHidden();
    createdName = ''; // deleted — nothing for the safety net
  });

  // Creating an address drives the Yandex geocoder (type address → pick the resolved point),
  // so it only runs where that external service is reachable. Opt in with RUN_GEOCODER=1.
  test('creates an address through the UI with the geocoder', async ({ branchesPage }) => {
    test.skip(!runGeocoderTests, 'Set RUN_GEOCODER=1 (needs the live Yandex geocoder)');
    const name = `QA-E2E-UI-${Date.now()}`;
    createdName = name;

    await branchesPage.goto();
    await branchesPage.openAddForm();
    await branchesPage.selectGeocodedAddress(addressQuery);
    await branchesPage.fillDetails({ name, phone: '+998901234567', floor: '3', comment: 'QA e2e' });

    const response = await branchesPage.submit();
    expect(response.status(), 'POST /vendors/locations').toBe(200);
    await expect(branchesPage.card(name)).toBeVisible();
  });
});
