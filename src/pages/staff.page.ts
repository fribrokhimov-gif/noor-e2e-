import { type Page, type Locator, type Response, expect } from '@playwright/test';

export type EmployeeRole = 'manager' | 'cashier';

export interface NewEmployee {
  lastName: string;
  firstName: string;
  phone: string;
  role?: EmployeeRole;
}

/**
 * Staff page (`/delivery/staff` → `/profile/users`). Employees CRUD:
 * tabs (All / Managers / Cashiers), an add modal, and per-row edit/delete actions.
 */
export class StaffPage {
  readonly page: Page;
  readonly addButton: Locator;
  readonly lastName: Locator;
  readonly firstName: Locator;
  readonly phone: Locator;
  readonly roleSelect: Locator;
  readonly saveButton: Locator;
  readonly addedToast: Locator;
  readonly confirmDelete: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addButton = page.getByRole('button', { name: 'Добавить' });
    this.lastName = page.locator('input[name="lastName"]');
    this.firstName = page.locator('input[name="firstName"]');
    this.phone = page.locator('input[name="phone"]');
    this.roleSelect = page.locator('select');
    this.saveButton = page.getByRole('button', { name: 'Сохранить' });
    this.addedToast = page.getByText('Сотрудник добавлен');
    this.confirmDelete = page.getByRole('button', { name: 'Да, удалить' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/delivery/staff');
    await expect(this.addButton).toBeVisible();
  }

  async openAddForm(): Promise<void> {
    await this.addButton.click();
    await expect(this.lastName).toBeVisible();
  }

  async fillEmployee({ lastName, firstName, phone, role = 'manager' }: NewEmployee): Promise<void> {
    await this.lastName.fill(lastName);
    await this.firstName.fill(firstName);
    await this.phone.fill(phone);
    await this.roleSelect.selectOption(role);
  }

  /** Save the add form; returns the `POST /merchant-employees` response. */
  async save(): Promise<Response> {
    const [response] = await Promise.all([
      this.page.waitForResponse((r) => r.url().includes('/merchant-employees') && r.request().method() === 'POST'),
      this.saveButton.click(),
    ]);
    return response;
  }

  /** A table row by its full name ("Lastname Firstname"). */
  row(fullName: string): Locator {
    return this.page.locator('tr, [class*="row"]').filter({ hasText: fullName }).first();
  }

  /** Delete an employee via the row action + confirmation; returns `DELETE /merchant-employees/{id}`. */
  async deleteEmployee(fullName: string): Promise<Response> {
    // The action icons exist twice (desktop + mobile layouts); target the visible one.
    const deleteButton = this.page.locator(`[aria-label^="Удалить ${fullName}"]:visible`).first();
    await deleteButton.click();
    await expect(this.confirmDelete).toBeVisible();
    const [response] = await Promise.all([
      this.page.waitForResponse((r) => r.url().includes('/merchant-employees/') && r.request().method() === 'DELETE'),
      this.confirmDelete.click(),
    ]);
    return response;
  }
}
