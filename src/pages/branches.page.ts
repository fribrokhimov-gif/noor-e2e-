import { type Page, type Locator, type Response, expect } from '@playwright/test';

export interface BranchDetails {
  name: string;
  phone?: string;
  floor?: string;
  comment?: string;
}

/**
 * Branches / addresses page (`/delivery/branches`). Address CRUD.
 * NOTE: creating an address needs the live Yandex geocoder (type address → pick the geocoded
 * point). List rendering and delete work without it.
 */
export class BranchesPage {
  readonly page: Page;
  readonly addAddressButton: Locator;
  readonly addressSearch: Locator;
  readonly name: Locator;
  readonly floor: Locator;
  readonly clientPhone: Locator;
  readonly comment: Locator;
  readonly submitButton: Locator;
  readonly confirmDelete: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addAddressButton = page.getByRole('button', { name: 'Добавить адрес' }).first();
    this.addressSearch = page.getByPlaceholder(/Найдите адрес/i);
    this.name = page.locator('input[name="name"]');
    this.floor = page.locator('input[name="floor"]');
    this.clientPhone = page.locator('input[name="client_phone"]');
    this.comment = page.locator('input[name="comment"]');
    // The modal's submit shares the "Добавить адрес" label; scope to the dialog.
    this.submitButton = page.getByRole('dialog').getByRole('button', { name: 'Добавить адрес' });
    // The delete confirmation ("Удалить локацию?") confirms with a plain "Да".
    this.confirmDelete = page.getByRole('button', { name: 'Да', exact: true });
  }

  async goto(): Promise<void> {
    await this.page.goto('/delivery/branches');
    await expect(this.addAddressButton).toBeVisible();
  }

  async openAddForm(): Promise<void> {
    await this.addAddressButton.click();
    await expect(this.addressSearch).toBeVisible();
  }

  /** Type an address and select the first geocoded suggestion (requires the live Yandex geocoder). */
  async selectGeocodedAddress(query: string): Promise<void> {
    await this.addressSearch.fill(query);
    const suggestion = this.page.getByRole('option').first();
    await suggestion.waitFor({ state: 'visible', timeout: 15_000 });
    await suggestion.click();
    // the map resolves coordinates; the "not found" placeholder disappears
    await expect(this.page.getByText('Координаты не найдены')).toBeHidden({ timeout: 15_000 });
  }

  async fillDetails({ name, phone, floor, comment }: BranchDetails): Promise<void> {
    await this.name.fill(name);
    if (floor) await this.floor.fill(floor);
    if (phone) await this.clientPhone.fill(phone);
    if (comment) await this.comment.fill(comment);
  }

  /** Submit the add form; returns the `POST /vendors/locations` response. */
  async submit(): Promise<Response> {
    const [response] = await Promise.all([
      this.page.waitForResponse((r) => r.url().includes('/vendors/locations') && r.request().method() === 'POST'),
      this.submitButton.click(),
    ]);
    return response;
  }

  /** An address card by its location name (the card's "view" button carries the name). */
  card(name: string): Locator {
    return this.page.getByRole('button', { name: `Просмотр адреса: ${name}` });
  }

  /** Delete an address via its card action + confirmation; returns `DELETE /vendors/locations/{id}`. */
  async deleteAddress(name: string): Promise<Response> {
    await this.page.locator(`[aria-label="Удалить адрес: ${name}"]`).click();
    await expect(this.confirmDelete).toBeVisible();
    const [response] = await Promise.all([
      this.page.waitForResponse((r) => /\/vendors\/locations\/\d+/.test(r.url()) && r.request().method() === 'DELETE'),
      this.confirmDelete.click(),
    ]);
    return response;
  }
}
