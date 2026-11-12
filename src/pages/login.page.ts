import { type Page, type Locator, type Response, expect } from '@playwright/test';
import { api } from '../config/env.js';

/**
 * The merchant login page (`/login`).
 * Phone + password, an optional "remember me", and a link to the password reset flow.
 */
export class LoginPage {
  readonly page: Page;
  readonly phone: Locator;
  readonly password: Locator;
  readonly rememberMe: Locator;
  readonly submitButton: Locator;
  readonly forgotPasswordLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.phone = page.locator('input[name="login"]');
    this.password = page.locator('input[name="password"]');
    this.rememberMe = page.locator('input[type="checkbox"]');
    this.submitButton = page.getByRole('button', { name: 'Войти' });
    this.forgotPasswordLink = page.getByRole('link', { name: /Забыли пароль/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
    await expect(this.phone).toBeVisible();
  }

  async fillCredentials(phone: string, password: string): Promise<void> {
    await this.phone.fill(phone);
    await this.password.fill(password);
  }

  /** Submit and return the `POST /auth/merchant` response, so a test can assert the contract. */
  async submitAndCaptureLogin(): Promise<Response> {
    const [response] = await Promise.all([
      this.page.waitForResponse((r) => r.url().includes('/api/v1/auth/merchant') && r.request().method() === 'POST'),
      this.submitButton.click(),
    ]);
    return response;
  }

  /** Full happy-path sign-in. Asserts the API returned tokens and the app left the login page. */
  async login(phone: string, password: string): Promise<void> {
    await this.fillCredentials(phone, password);
    const response = await this.submitAndCaptureLogin();
    expect(response.status(), 'login should succeed').toBe(200);
    const body = await response.json();
    expect(body.data.access_token, 'access_token in login response').toBeTruthy();
    await this.page.waitForURL('**/welcome', { timeout: 15_000 });
  }

  async openForgotPassword(): Promise<void> {
    await this.forgotPasswordLink.click();
    await this.page.waitForURL('**/reset-password');
  }

  /** Any visible credential error (localised); used for the invalid-login assertion. */
  errorMessage(): Locator {
    return this.page.getByText(/неверн|не найден|invalid|incorrect|ошибк/i).first();
  }

  // Re-export the endpoint globs for tests that assert on the network.
  static readonly endpoints = api;
}
