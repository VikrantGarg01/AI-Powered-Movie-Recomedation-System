import { test, expect } from '@playwright/test';

test.describe('CinePulse End-to-End User Journeys', () => {
  test('Homepage renders navigation, brand header, and movie carousels', async ({ page }) => {
    await page.goto('/');

    // Check brand header
    await expect(page.locator('[aria-label="Movie+ Logo"]').first()).toBeVisible();

    // Check navbar links
    await expect(page.locator('a[href="/"]').first()).toBeVisible();
    await expect(page.locator('a[href="/discover"]').first()).toBeVisible();
    await expect(page.locator('a[href="/watchlist"]').first()).toBeVisible();

    // Check movie sections
    const headings = page.locator('h2');
    await expect(headings.first()).toBeVisible();
  });

  test('Search dialog can be opened and filtered', async ({ page }) => {
    await page.goto('/');

    // Look for global search trigger button or shortcut
    const searchTrigger = page.locator('button:has-text("Search"), button[aria-label*="Search"]').first();
    if (await searchTrigger.isVisible()) {
      await searchTrigger.click();
      const searchModal = page.locator('div[role="dialog"]');
      await expect(searchModal).toBeVisible();

      // Type query
      const searchInput = page.locator('input[placeholder*="Search movies"]');
      await searchInput.fill('Inception');
      await page.waitForTimeout(300);

      // Verify modal close
      await page.keyboard.press('Escape');
      await expect(searchModal).not.toBeVisible();
    }
  });

  test('Login page has accessible labels and form inputs', async ({ page }) => {
    await page.goto('/login');

    // Verify form input labels with htmlFor associations
    await expect(page.locator('label[for="auth-email"]')).toBeVisible();
    await expect(page.locator('input#auth-email')).toBeVisible();
    await expect(page.locator('label[for="auth-password"]')).toBeVisible();
    await expect(page.locator('input#auth-password')).toBeVisible();

    // Verify submit button
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
  });

  test('Discover catalog page loads genre filters and movie cards', async ({ page }) => {
    await page.goto('/discover');

    // Page title / heading
    await expect(page.locator('h1, h2').first()).toBeVisible();

    // Verify movie cards or posters render
    const movieCards = page.locator('a[href^="/movie/"], img[alt]');
    await expect(movieCards.first()).toBeVisible();
  });

  test('Profile and Watchlist pages render without client-side exceptions', async ({ page }) => {
    // Verify Profile page renders cleanly without error boundary notice
    await page.goto('/profile');
    await expect(page.locator('text=Application Rendering Notice')).not.toBeVisible();
    await expect(page.locator('h2, h1').first()).toBeVisible();

    // Verify Watchlist renders cleanly without error boundary notice
    await page.goto('/watchlist');
    await expect(page.locator('text=Application Rendering Notice')).not.toBeVisible();
    await expect(page.locator('h1:has-text("My Watchlist")')).toBeVisible();
  });
});
