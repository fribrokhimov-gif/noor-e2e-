import { type Page, type Locator, type Response, expect } from '@playwright/test';

/**
 * The password-reset flow (`/reset-password`), three steps:
 *   1. enter phone  → POST /otp/send
 *   2. enter the 6-digit OTP (auto-submits) → POST /otp/confirm
 *   3. set a new password + confirm → POST /auth/merchants/set-password → redirect to /login
 */
export class ResetPasswordPage {
  readonly page: Page;
  readonly phone: Locator;
  readonly sendCodeButton: Locator;
  readonly otpBoxes: Locator;
  readonly newPassword: Locator;
  readonly confirmPassword: Locator;
  readonly changePasswordButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.phone = page.locator('input[name="phone"]');
    this.sendCodeButton = page.getByRole('button', { name: /Отправить код/i });
    this.otpBoxes = page.locator('input[type="text"]');
    this.newPassword = page.locator('input[name="password"]');
    this.confirmPassword = page.locator('input[name="confirmPassword"]');
    this.changePasswordButton = page.getByRole('button', { name: /Изменить пароль/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/reset-password');
    await expect(this.phone).toBeVisible();
  }

  /** Step 1 — request the OTP. Returns the `POST /otp/send` response. */
  async requestCode(phone: string): Promise<Response> {
    await this.phone.fill(phone);
    const [response] = await Promise.all([
      this.page.waitForResponse((r) => r.url().includes('/api/v1/otp/send') && r.request().method() === 'POST'),
      this.sendCodeButton.click(),
    ]);
    await expect(this.otpBoxes.first()).toBeVisible();
    return response;
  }

  /** Step 2 — type the code into the 6 boxes; it auto-submits. Returns `POST /otp/confirm`. */
  async enterOtp(code: string): Promise<Response> {
    const boxes = this.otpBoxes;
    await expect(boxes).toHaveCount(code.length);
    const responsePromise = this.page.waitForResponse(
      (r) => r.url().includes('/api/v1/otp/confirm') && r.request().method() === 'POST',
    );
    for (let i = 0; i < code.length; i++) await boxes.nth(i).fill(code[i]);
    const response = await responsePromise;
    await expect(this.newPassword).toBeVisible();
    return response;
  }

  /** Step 3 — set the new password. Returns `POST /auth/merchants/set-password`. */
  async setNewPassword(password: string): Promise<Response> {
    await this.newPassword.fill(password);
    await this.confirmPassword.fill(password);
    const [response] = await Promise.all([
      this.page.waitForResponse((r) => r.url().includes('/api/v1/auth/merchants/set-password') && r.request().method() === 'POST'),
      this.changePasswordButton.click(),
    ]);
    return response;
  }
}
