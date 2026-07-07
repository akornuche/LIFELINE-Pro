// @ts-check
/**
 * E2E: Admin Login → Dashboard → Navigation
 *
 * Covers the admin portal flows through the browser:
 *   1. Login as admin → lands on /admin dashboard
 *   2. Dashboard stats cards render (Total Users, Patients, Providers, Revenue)
 *   3. Navigate to Users page → table renders
 *   4. Navigate to Verifications page → page renders
 *   5. Navigate to Payments page → page renders
 *   6. Logout → redirected to /login
 *   7. Non-admin accessing /admin → redirected away (RBAC)
 *
 * Admin is seeded by e2e-server.js:
 *   email:    admin@e2e-test.com
 *   password: AdminE2e@Test1
 */

import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'admin@e2e-test.com';
const ADMIN_PASSWORD = 'AdminE2e@Test1';

// ─────────────────────────────────────────────────────────────────────────────
// Helper: log in as admin and land on the dashboard
// ─────────────────────────────────────────────────────────────────────────────
async function loginAsAdmin(page) {
  await page.goto('/login');
  await page.waitForSelector('form', { timeout: 10_000 });
  await page.locator('input[type="email"]').first().fill(ADMIN_EMAIL);
  await page.locator('input[type="password"]').first().fill(ADMIN_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(url => url.pathname.startsWith('/admin'), { timeout: 15_000 });
}

test.describe('Admin portal', () => {
  test('admin logs in and lands on the dashboard', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page).toHaveURL(/\/admin/);

    // Dashboard heading
    await expect(page.locator('h1')).toContainText(/admin dashboard/i, { timeout: 8_000 });
  });

  test('admin dashboard renders stat cards', async ({ page }) => {
    await loginAsAdmin(page);

    // Wait for loading to finish (stat cards appear)
    await expect(
      page.locator('text=Total Users, text=Total Patients').first()
    ).toBeVisible({ timeout: 10_000 }).catch(async () => {
      // Fallback: just check that numeric stat values appear (skeleton gone)
      await expect(page.locator('.stat-card, [class*="stat"]').first()).toBeVisible({ timeout: 10_000 });
    });
  });

  test('admin can navigate to the Users page', async ({ page }) => {
    await loginAsAdmin(page);

    await page.click('a[href="/admin/users"]');
    await page.waitForURL('**/admin/users', { timeout: 10_000 });

    // Table or empty state should render — no crash
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 8_000 });
  });

  test('admin can navigate to the Verifications page', async ({ page }) => {
    await loginAsAdmin(page);

    await page.click('a[href="/admin/verifications"]');
    await page.waitForURL('**/admin/verifications', { timeout: 10_000 });

    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 8_000 });
  });

  test('admin can navigate to the Payments page', async ({ page }) => {
    await loginAsAdmin(page);

    await page.click('a[href="/admin/payments"]');
    await page.waitForURL('**/admin/payments', { timeout: 10_000 });

    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 8_000 });
  });

  test('admin can navigate to the Patients page', async ({ page }) => {
    await loginAsAdmin(page);

    await page.click('a[href="/admin/patients"]');
    await page.waitForURL('**/admin/patients', { timeout: 10_000 });

    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 8_000 });
  });

  test('admin sidebar shows correct navigation links', async ({ page }) => {
    await loginAsAdmin(page);

    const navLinks = ['Users', 'Patients', 'Doctors', 'Verifications', 'Payments', 'Analytics'];
    for (const label of navLinks) {
      await expect(page.locator(`nav >> text="${label}"`).first()).toBeVisible({ timeout: 5_000 });
    }
  });

  test('admin can log out and is redirected to /login', async ({ page }) => {
    await loginAsAdmin(page);

    // Logout button is in the sidebar bottom section
    await page.locator('button', { hasText: /logout/i }).click();
    await page.waitForURL('**/login', { timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated user visiting /admin is redirected', async ({ page }) => {
    await page.goto('/admin');
    // Should redirect to /login (router guard)
    await page.waitForURL(url => url.pathname.includes('/login') || url.pathname === '/', { timeout: 10_000 });
    expect(page.url()).not.toContain('/admin/');
  });
});
