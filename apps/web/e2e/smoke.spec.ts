import { expect, test } from '@playwright/test';

test('homepage is a minimal four-mode launcher', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.panel')).toHaveCount(4);
  await expect(page.locator('.panel-title')).toContainText([
    'Explore',
    'Journey',
    'Chart Room',
    'Academy',
  ]);
  // No navbar, and the labels above the panels are gone.
  await expect(page.locator('.site-nav')).toHaveCount(0);
  await expect(page.locator('.portal-labels')).toHaveCount(0);
  await expect(page.locator('.portal-logo')).toBeVisible();
  // Only a search icon and an avatar float on the right.
  await expect(page.locator('.launch-icon')).toBeVisible();
  await expect(page.locator('.avatar-button')).toBeVisible();
  // The search icon expands into the live field.
  await page.locator('.launch-icon').click();
  await expect(page.locator('.launch-search-field #search')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('.launch-search-field')).toHaveCount(0);
  // The avatar opens the profile panel with working appearance + language.
  await page.locator('.avatar-button').click();
  await expect(page.locator('.profile-menu')).toBeVisible();
  await expect(page.locator('.profile-menu')).toContainText('Appearance');
  await page.getByRole('menuitemradio', { name: 'Light' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'parchment');
  await page.keyboard.press('Escape');
  // Hovering reveals the mode's invitation.
  await page.locator('.panel--chart').hover();
  await expect(page.getByRole('link', { name: 'Open Chart Room' })).toBeVisible();
  // One screen: nothing scrolls.
  const canScroll = await page.evaluate(() => {
    window.scrollTo(0, 2000);
    return window.scrollY > 0;
  });
  expect(canScroll).toBe(false);
});

test('the homepage localizes into Romanian', async ({ page }) => {
  await page.goto('/');
  await page.locator('.avatar-button').click();
  await page.getByRole('menuitemradio', { name: 'Romanian' }).click();
  await page.keyboard.press('Escape');
  await expect(page.locator('.panel--chart .panel-title')).toHaveText('Camera Hărților');
  await expect(page.locator('.panel--explore .panel-title')).toHaveText('Explorează');
});

test('choosing a mode steps through to its route', async ({ page }) => {
  await page.goto('/');
  await page.locator('.panel--explore').hover();
  await page.locator('.panel--explore .uc-btn--primary').click();
  await page.waitForURL(/\/explore$/, { timeout: 4000 });
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

test('uncharted addresses are a single-screen hero, not an error', async ({ page }) => {
  await page.goto('/uncharted-waters');
  await expect(page.locator('.uc-title')).toContainText('uncharted waters');
  await expect(page.locator('.uc-photo')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Continue exploring' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Return home' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open the atlas' })).toBeVisible();
  // The page never names the error, and nothing lives below the hero.
  await expect(page.locator('body')).not.toContainText('404');
  await expect(page.locator('body')).not.toContainText('not found');
  await expect(page.locator('.uc-sections')).toHaveCount(0);
  // The hero IS the page: it cannot be scrolled.
  const canScroll = await page.evaluate(() => {
    window.scrollTo(0, 2000);
    return window.scrollY > 0;
  });
  expect(canScroll).toBe(false);
});

test('legendary waters grant the hidden trophy', async ({ page }) => {
  await page.goto('/somewhere-secret?legend=1');
  await expect(page.locator('.uc-eyebrow')).toContainText('legendary');
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
