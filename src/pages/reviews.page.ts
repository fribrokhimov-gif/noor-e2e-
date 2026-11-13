import { type Page, type Locator, type Response } from '@playwright/test';

/** Reviews page (`/delivery/reviews`, "Отзывы") — customer ratings of deliveries. */
export class ReviewsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Отзывы' });
    this.emptyState = page.getByText(/Данные не найдены|Пока нет отзывов/i);
  }

  /** Navigate and return the `GET /ratings` response. */
  async open(): Promise<Response> {
    const [response] = await Promise.all([
      this.page.waitForResponse((r) => r.url().includes('/api/v1/ratings') && r.request().method() === 'GET'),
      this.page.goto('/delivery/reviews'),
    ]);
    return response;
  }
}
