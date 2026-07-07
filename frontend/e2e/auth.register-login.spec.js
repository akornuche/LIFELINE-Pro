// @ts-check
/**
 * E2E: Register → Login → Patient Dashboard
 *
 * Covers the full user-facing registration and login flow through the browser:
 *   1. Visit /register, fill the patient registration form, submit
 *   2. Expect to land on the patient dashboard (or a redirect to /login)
 *   3. If redirected to /login: log in and reach the dashboard
 *   4. Verify the dashboard shows the user's name
 *
 * The backend runs against an isolated SQLite DB (see playwright.config.js).
 */

import { test, expect } from '@playwright/test';

const TS = Date.now();
const EMAIL = `e2e-patient-${TS}@example.com`;
const PASSWORD = 'E2eTest@1234';
const FIRST_NAME = 'E2e';
const LAST_NAME = 'Patient';

test.describe('Patient registration and login flow', () => {
  test('registers a new patient account via the UI form', async ({ page }) => {
    await page.goto('/register');

    // Wait for the registration form to be visible
    await page.waitForSelector('form', { timeout: 10_000 });

    // User type defaults to 'patient' — the role buttons are not <select>, no action needed.

    // Fill fields — the form uses id= attributes (no name= attributes on inputs)
    await page.locator('#firstName').fill(FIRST_NAME);
    await page.locator('#lastName').fill(LAST_NAME);
    await page.locator('#email').fill(EMAIL);
    await page.locator('#phone').fill('08011122233');
    await page.locator('#dateOfBirth').fill('1990-05-15');
    await page.locator('#gender').selectOption('male');
    await page.locator('#address').fill('12 Test Street, Victoria Island, Lagos');
    await page.locator('#city').fill('Lagos');
    await page.locator('#state').selectOption('Lagos');

    // Emergency contact — required HTML fields for patient type
    await page.locator('#emergencyName').fill('Jane Patient');
    await page.locator('#emergencyPhone').fill('08099988877');
    await page.locator('#emergencyRelationship').selectOption('sibling');

    // Password fields
    await page.locator('#password').fill(PASSWORD);
    await page.locator('#confirmPassword').fill(PASSWORD);

    // Accept terms — required, submit button disabled without it
    await page.locator('#terms').check();

    // Assert checkbox is checked and button is enabled before clicking
    await expect(page.locator('#terms')).toBeChecked({ timeout: 2_000 });
    await expect(page.locator('button[type="submit"]')).toBeEnabled({ timeout: 2_000 });

    // Submit the form
    await page.locator('button[type="submit"]').click();

    // After submission: registration always redirects to /login?registered=true
    await page.waitForURL(url => url.pathname.includes('/login'), { timeout: 15_000 })
      .catch(async () => {
        const errorEl = page.locator('[class*="error"], [class*="danger"], [role="alert"]').first();
        const errorText = await errorEl.textContent().catch(() => 'no error element found');
        throw new Error(`Expected redirect to /login after registration. Error on page: ${errorText}`);
      });
  });

  test('logs in with the registered account and sees the dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('form', { timeout: 10_000 });

    await page.locator('input[type="email"]').first().fill(EMAIL);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.locator('button[type="submit"]').click();

    // Should redirect to patient dashboard
    await page.waitForURL(
      url => url.pathname.includes('/patient') || url.pathname.includes('/dashboard'),
      { timeout: 15_000 }
    );

    // Dashboard should greet the user by name
    const body = await page.locator('body').textContent();
    expect(body).toContain(FIRST_NAME);
  });

  test('landing page loads and shows navigation links', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/lifeline/i);
    // At least one navigation link present
    const navLinks = page.locator('nav a');
    await expect(navLinks.first()).toBeVisible({ timeout: 5_000 });
  });

  test('visiting protected route without login redirects to /login', async ({ page }) => {
    // Patient dashboard is at /patient (path: '') — /patient/dashboard does not exist
    await page.goto('/patient');
    await page.waitForURL(url => url.pathname.includes('/login'), { timeout: 10_000 });
    await expect(page).toHaveURL(/login/);
  });
});
