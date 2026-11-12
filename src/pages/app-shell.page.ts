import { type Page, type Locator, type Response, expect } from '@playwright/test';

/**
 * The authenticated app shell (header + avatar menu). Owns the sign-out flow:
 * avatar → menu ("Профиль" / "Выйти" / language) → confirmation dialog.
 */
export class AppShell {
  readonly page: Page;
  readonly avatar: Locator;
  readonly menuSignOut: Locator;
  readonly menuProfile: Locator;
  readonly confirmDialog: Locator;
  readonly confirmSignOut: Locator;
  readonly cancelSignOut: Locator;

  constructor(page: Page) {
    this.page = page;
    // The avatar is the last control in the header; opens the account menu.
    this.avatar = page.locator('header button').last();
    this.menuSignOut = page.getByText('Выйти', { exact: true });
    this.menuProfile = page.getByText('Профиль', { exact: true });
    this.confirmDialog = page.getByText('Выйти из аккаунта?');
    this.confirmSignOut = page.getByRole('button', { name: 'Выйти' });
    this.cancelSignOut = page.getByRole('button', { name: 'Отмена' });
  }

  async openAccountMenu(): Promise<void> {
    await this.avatar.click();
    await expect(this.menuSignOut).toBeVisible();
  }

  async openSignOutDialog(): Promise<void> {
    await this.openAccountMenu();
    await this.menuSignOut.click();
    await expect(this.confirmDialog).toBeVisible();
  }

  /** Confirm sign-out and return the `POST /auth/logout` response. */
  async confirmLogout(): Promise<Response> {
    const [response] = await Promise.all([
      this.page.waitForResponse((r) => r.url().includes('/api/v1/auth/logout') && r.request().method() === 'POST'),
      this.confirmSignOut.click(),
    ]);
    return response;
  }

  async cancelLogout(): Promise<void> {
    await this.cancelSignOut.click();
    await expect(this.confirmDialog).toBeHidden();
  }
}
