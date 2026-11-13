import { type Page, type Locator, type Response } from '@playwright/test';

/** Clients page (`/delivery/clients`, "Все клиенты") — the merchant's customer directory. */
export class ClientsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly search: Locator;
  readonly dateFilter: Locator;
  readonly rows: Locator;

  static readonly COLUMNS = ['Имя клиента', 'Дата', 'Телефон', 'Почта'];

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Все клиенты' });
    this.search = page.getByPlaceholder('Поиск по айди');
    this.dateFilter = page.getByRole('button', { name: /Выбранные даты/i });
    this.rows = page.locator('tbody tr');
  }

  column(name: string): Locator {
    return this.page.getByRole('columnheader', { name });
  }

  /** Navigate and return the `GET /vendors/clients` response. */
  async open(): Promise<Response> {
    const [response] = await Promise.all([
      this.page.waitForResponse((r) => r.url().includes('/api/v1/vendors/clients') && r.request().method() === 'GET'),
      this.page.goto('/delivery/clients'),
    ]);
    return response;
  }
}
