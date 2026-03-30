import { expect, test, type Page } from '@playwright/test';

async function dismissCookieBannerIfPresent(page: Page) {
  const acceptAllButton = page.getByRole('button', { name: /accept all/i });
  if (await acceptAllButton.isVisible().catch(() => false)) {
    await acceptAllButton.click();
  }
}

async function getFirstPublicListing(page: Page) {
  const response = await page.request.get('/api/public/listings?inStockOnly=false&limit=1&sortBy=newest');
  expect(response.ok()).toBeTruthy();

  const payload = await response.json();
  const listing = Array.isArray(payload?.listings) ? payload.listings[0] : null;
  expect(listing).toBeTruthy();
  return listing;
}

async function getFirstPublicListingPath(page: Page) {
  const listing = await getFirstPublicListing(page);

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

  test('home quick search flows into search results and inquiry', async ({ page }) => {
    const listing = await getFirstPublicListing(page);
    const query =
      String(listing.make || listing.manufacturer || listing.model || listing.title || '')
        .trim()
        .split(/\s+/)
        .find(Boolean) || 'equipment';

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await dismissCookieBannerIfPresent(page);

    const quickSearchInput = page.getByPlaceholder(/quick search equipment/i).first();
    await expect(quickSearchInput).toBeVisible();
    await quickSearchInput.fill(query);
    await quickSearchInput.press('Enter');

    await expect(page).toHaveURL(/\/search\?q=/i);

    const firstDetailsLink = page.getByRole('link', { name: /details/i }).first();
    await expect(firstDetailsLink).toBeVisible();
    await firstDetailsLink.click();

    await dismissCookieBannerIfPresent(page);
    await expect(page).toHaveURL(/\/(listing|equipment)\//i);
    await expect(page.getByRole('heading', { name: 'Equipment Overview' })).toBeVisible();
    await page.getByRole('button', { name: /send inquiry/i }).click();

    await expect(page.getByRole('heading', { name: /contact seller/i })).toBeVisible();
    await expect(page.getByText(/specific listing/i)).toBeVisible();
  });
});
