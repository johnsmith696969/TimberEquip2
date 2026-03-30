import { expect, test, type Page } from '@playwright/test';

async function dismissCookieBannerIfPresent(page: Page) {
  const acceptAllButton = page.getByRole('button', { name: /accept all/i });
  if (await acceptAllButton.isVisible().catch(() => false)) {
    await acceptAllButton.click();
  }
}

async function getFirstPublicListingPath(page: Page) {
  const response = await page.request.get('/api/public/listings?inStockOnly=false&limit=1&sortBy=newest');
  expect(response.ok()).toBeTruthy();

  const payload = await response.json();
  const listing = Array.isArray(payload?.listings) ? payload.listings[0] : null;
  expect(listing).toBeTruthy();

  if (listing.publicPath) return String(listing.publicPath);
  if (listing.path) return String(listing.path);
  return `/listing/${listing.id}`;
}

test.describe('public critical journeys', () => {
  test('home hero, categories, and listing detail render correctly', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await dismissCookieBannerIfPresent(page);

    await expect(page.locator(`img[src*="grapple-hero-image"]`)).toBeVisible();
    await expect(page.getByRole('link', { name: /browse inventory/i }).first()).toBeVisible();

    await page.goto('/categories', { waitUntil: 'domcontentloaded' });
    await dismissCookieBannerIfPresent(page);

    await expect(page.getByRole('heading', { name: /categories/i }).first()).toBeVisible();
    await expect(page.locator('a[href*="/search?category="]').first()).toBeVisible();

    const listingPath = await getFirstPublicListingPath(page);
    await page.goto(listingPath, { waitUntil: 'domcontentloaded' });
    await dismissCookieBannerIfPresent(page);

    await expect(page.getByRole('heading', { name: 'Equipment Overview' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Technical Specifications' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Market Match Recommendations' })).toBeVisible();
    await expect(page.getByRole('button', { name: /send inquiry/i })).toBeVisible();
  });

  test('listing detail inquiry modal opens with consent controls', async ({ page }) => {
    const listingPath = await getFirstPublicListingPath(page);

    await page.goto(listingPath, { waitUntil: 'domcontentloaded' });
    await dismissCookieBannerIfPresent(page);

    await page.getByRole('button', { name: /send inquiry/i }).click();

    await expect(page.getByRole('heading', { name: /contact seller/i })).toBeVisible();
    await expect(page.getByText(/full name/i)).toBeVisible();
    await expect(page.locator('input[type="text"]').first()).toBeVisible();
    await expect(page.getByText(/email address/i)).toBeVisible();
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(page.getByText(/phone number/i)).toBeVisible();
    await expect(page.locator('input[type="tel"]').first()).toBeVisible();
    await expect(page.locator('textarea').first()).toBeVisible();
    await expect(page.getByRole('checkbox').first()).toBeVisible();
    await expect(page.getByText(/specific listing/i)).toBeVisible();
  });
});
