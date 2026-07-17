import { expect, test } from '@playwright/test';

test('homepage answers the five-second test', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.home-hero-title')).toContainText('Where oceans meet');
  await expect(page.getByRole('link', { name: 'Start exploring' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open the map' })).toBeVisible();
  await expect(page.locator('.site-nav a')).toHaveCount(4);
});

test('strait article tells its story with sourced facts', async ({ page }) => {
  await page.goto('/straits/gibraltar');
  await expect(page.locator('.strait-hero--image')).toBeVisible();
  await expect(page.locator('.detail-section', { hasText: 'Why it matters' })).toBeVisible();
  await expect(page.locator('.facts--line .fact-label', { hasText: 'Narrowest' })).toBeVisible();
  await expect(page.locator('.detail-section', { hasText: 'The long read' })).toBeVisible();
  await expect(page.locator('.card h3', { hasText: 'Orca' })).toBeVisible();
});

test('journey mode travels stop by stop', async ({ page }) => {
  await page.goto('/journeys/oil-to-europe');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: 'Start journey' }).first().click();
  await expect(page.locator('.voyage-card')).toBeVisible();
  await expect(page.locator('.k-count')).toContainText('Stop 1 / 8');
  await page.locator('.next-strip').click();
  await expect(page.locator('.k-count')).toContainText('Stop 2 / 8');
  await expect(page.locator('.xp-tab', { hasText: 'Numbers' })).toBeVisible();
});

test('deep links open the voyage at the shared stop', async ({ page }) => {
  await page.goto('/journeys/oil-to-europe?stop=3');
  await expect(page.locator('.k-count')).toContainText('Stop 3 / 8');
});

test('quiz reveals answers in green and red', async ({ page }) => {
  await page.goto('/quiz');
  await page.locator('.quiz-option').first().click();
  await expect(page.locator('.quiz-option--correct')).toHaveCount(1);
});

test('search is summonable everywhere and finds straits', async ({ page }) => {
  await page.goto('/learn');
  await page.locator('.search-trigger').click();
  await expect(page.locator('.search-overlay')).toBeVisible();
  await page.locator('#search').fill('bosporus');
  await expect(page.locator('#search-results [role="option"]').first()).toContainText('Bosporus');
});

test('map page offers the chart with its toggles', async ({ page }) => {
  await page.goto('/map');
  await expect(page.locator('#map')).toBeVisible();
  await expect(page.getByRole('button', { name: /Trade lanes/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Set adrift/ })).toBeVisible();
});

test('uncharted addresses become a discovery page, not an error', async ({ page }) => {
  await page.goto('/uncharted-waters');
  await expect(page.locator('.uc-title')).toContainText('uncharted waters');
  await expect(page.locator('.uc-photo')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Continue exploring' })).toBeVisible();
  // The page never names the error.
  await expect(page.locator('.uncharted')).not.toContainText('404');
  await expect(page.locator('.uc-sections')).not.toContainText('not found');
  // Discovery sections are present and the captain's log recommends onward.
  await expect(page.locator('.uc-feature').first()).toBeVisible();
  await expect(page.locator('.uc-log')).toContainText('Continue exploring');
});

test('legendary waters grant the hidden trophy', async ({ page }) => {
  await page.goto('/somewhere-secret?legend=1');
  await expect(page.locator('.uc-legend-card')).toContainText('true places never are');
  await page.goto('/profile');
  await expect(
    page.locator('.trophy-card.is-earned', { hasText: 'Beyond the Chart' }),
  ).toBeVisible();
});

test("captain's log keeps the score", async ({ page }) => {
  await page.goto('/profile');
  await expect(page.locator('.rank-title')).toContainText('Cadet');
  await expect(page.locator('.stamp')).toHaveCount(7);
  await expect(page.locator('.trophy-card')).toHaveCount(18);
  await page.goto('/passport');
  await expect(page).toHaveURL(/\/profile$/);
});
