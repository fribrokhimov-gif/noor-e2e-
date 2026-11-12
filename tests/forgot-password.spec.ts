import { test, expect } from '../src/fixtures/test-fixtures.js';
import { env, hasMerchantCreds, hasResetOtp } from '../src/config/env.js';

const NEW_PASSWORD = 'Noor-Reset-E2E-1!';

test.describe('Forgot password', () => {
  test.skip(
    !hasMerchantCreds || !hasResetOtp,
    'Set MERCHANT_PHONE / MERCHANT_PASSWORD and RESET_OTP (the hardcoded test OTP)',
  );

  test('resets the password via OTP and signs in with the new one @smoke', async ({
    resetPasswordPage,
    loginPage,
    disposableAccount,
    page,
  }) => {
    await resetPasswordPage.goto();

    // Step 1 — request the code.
    const sent = await resetPasswordPage.requestCode(disposableAccount.phone);
    expect(sent.status(), 'POST /otp/send').toBe(200);

    // Step 2 — confirm the OTP.
    const confirmed = await resetPasswordPage.enterOtp(env.resetOtp);
    expect(confirmed.status(), 'POST /otp/confirm').toBe(200);
    expect((await confirmed.json()).data.confirmation_id, 'confirmation_id').toBeTruthy();

    // Step 3 — set the new password.
    const set = await resetPasswordPage.setNewPassword(NEW_PASSWORD);
    expect(set.status(), 'POST /auth/merchants/set-password').toBe(200);

    // The flow returns to the login page.
    await page.waitForURL('**/login');

    // End to end: the new password now signs the account in.
    await loginPage.login(disposableAccount.phone, NEW_PASSWORD);
    await expect(page).toHaveURL(/\/welcome/);
  });
});
