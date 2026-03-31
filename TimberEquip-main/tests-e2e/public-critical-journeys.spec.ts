import { expect, test, type Page } from '@playwright/test';
import { buildListingPath } from '../src/utils/listingPath';

async function dismissCookieBannerIfPresent(page: Page) {
  const acceptAllButton = page.getByRole('button', { name: /accept all/i });
  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (await acceptAllButton.isVisible().catch(() => false)) {
      await acceptAllButton.click();
      await page.waitForTimeout(200);
      return;
    }
    await page.waitForTimeout(250);
  }
}

async function getFirstPublicListing(page: Page) {
  const response = await page.request.get('/api/public/listings?inStockOnly=false&limit=25&sortBy=newest');
  expect(response.ok()).toBeTruthy();

  const payload = await response.json();
  const listings = Array.isArray(payload?.listings) ? payload.listings : [];
  const listing =
    listings.find((entry: any) => {
      const approvalStatus = String(entry?.approvalStatus || '').trim().toLowerCase();
      const status = String(entry?.status || '').trim().toLowerCase();
      return status === 'active' && approvalStatus === 'approved';
    }) ||
    listings.find((entry: any) => String(entry?.status || '').trim().toLowerCase() === 'active') ||
    listings[0] ||
    null;
  expect(listing).toBeTruthy();
  return listing;
}

async function getFirstPublicListingPath(page: Page) {
  const listing = await getFirstPublicListing(page);

  if (listing.publicPath) return String(listing.publicPath);
  if (listing.path) return String(listing.path);
  return buildListingPath(listing);
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

  test('financing wizard advances through the public application steps', async ({ page }) => {
    await page.goto('/financing', { waitUntil: 'domcontentloaded' });
    await dismissCookieBannerIfPresent(page);

    await expect(page.getByRole('heading', { name: /institutional financing/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /entity information/i })).toBeVisible();

    await page.getByRole('button', { name: /continue to equipment details/i }).click();
    await expect(page.getByRole('heading', { name: /equipment & credit requirements/i })).toBeVisible();

    await page.getByRole('button', { name: /continue to verification/i }).click();
    await expect(page.getByRole('heading', { name: /identity verification/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /submit application/i })).toBeVisible();
    await expect(page.getByText(/specific to this financing request/i)).toBeVisible();
  });

  test('ad programs exposes public seller-plan enrollment states', async ({ page }) => {
    await page.goto('/ad-programs', { waitUntil: 'domcontentloaded' });
    await dismissCookieBannerIfPresent(page);

    await expect(page.getByRole('heading', { name: /seller tools and visibility/i })).toBeVisible();
    await page.getByRole('button', { name: /select owner-operator ad program/i }).click();

    await expect(page.getByText(/owner-operator quantity/i)).toBeVisible();
    await expect(page.getByText(/total: \$39\/month for 1 active listing slot/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in and continue/i })).toBeVisible();

    await page.getByRole('button', { name: /connect with support team/i }).first().click();
    await expect(page.getByRole('heading', { name: /contact support team/i })).toBeVisible();
  });
});
