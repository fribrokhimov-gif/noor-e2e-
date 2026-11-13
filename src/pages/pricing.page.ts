import { type Page, type Locator, type Response } from '@playwright/test';

/** Tariffs page (`/delivery/tariffs`, "Как формируется цена") — the merchant's rate card. */
export class PricingPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly demandCoefficient: Locator;
  readonly minimumCost: Locator;
  readonly newPoint: Locator;
  readonly cancelPrice: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Как формируется цена' });
    this.demandCoefficient = page.getByText('Коэффициент спроса').first();
    this.minimumCost = page.getByText('Минимальная стоимость');
    this.newPoint = page.getByText('Новая точка');
    this.cancelPrice = page.getByText('Цена отмены заказа');
  }

  /** Navigate and return the `GET /vendors/pricing` response. */
  async open(): Promise<Response> {
    const [response] = await Promise.all([
      this.page.waitForResponse((r) => r.url().includes('/api/v1/vendors/pricing') && r.request().method() === 'GET'),
      this.page.goto('/delivery/tariffs'),
    ]);
    return response;
  }
}
