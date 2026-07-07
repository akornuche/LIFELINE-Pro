// @ts-check
/**
 * E2E: Doctor Registration → Verification → Dashboard
 *
 * Covers the doctor portal flows through the browser:
 *   1. A new doctor registers via the UI form → redirected to /login
 *   2. Pre-seeded verified doctor logs in → lands on /doctor dashboard
 *   3. Doctor dashboard stats cards render
 *   4. Doctor navigates to Consultations page
 *   5. Doctor navigates to Prescriptions page
 *   6. Doctor logs out → redirected to /login
 *   7. Unverified doctor registration shows correct post-register message/redirect
 *
 * The pre-verified doctor is seeded by e2e-server.js:
 *   email:    doctor@e2e-test.com
 *   password: DoctorE2e@Test1
 */

import { test, expect } from '@playwright/test';

const VERIFIED_DOCTOR_EMAIL = 'doctor@e2e-test.com';
const VERIFIED_DOCTOR_PASSWORD = 'DoctorE2e@Test1';

const TS = Date.now();
const NEW_DOCTOR_EMAIL = `e2e-doctor-${TS}@example.com`;
const NEW_DOCTOR_PASSWORD = 'DoctorNew@1234';

// ─────────────────────────────────────────────────────────────────────────────
// Helper: log in as the pre-verified doctor
// ─────────────────────────────────────────────────────────────────────────────
async function loginAsDoctor(page) {
  await page.goto('/login');
  await page.waitForSelector('form', { timeout: 10_000 });
  await page.locator('input[type="email"]').first().fill(VERIFIED_DOCTOR_EMAIL);
  await page.locator('input[type="password"]').first().fill(VERIFIED_DOCTOR_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(url => url.pathname.startsWith('/doctor'), { timeout: 15_000 });
}

test.describe('Doctor registration flow', () => {
  test('new doctor can register via the UI form', async ({ page }) => {
    await page.goto('/register');
    await page.waitForSelector('form', { timeout: 10_000 });

    // Select "Doctor" user type
    await page.locator('button', { hasText: /^doctor$/i }).click()
      .catch(() => page.locator('[data-value="doctor"], input[value="doctor"]').click());

    // Fill common fields
    await page.locator('#firstName').fill('E2E');
    await page.locator('#lastName').fill('Doctor');
    await page.locator('#email').fill(NEW_DOCTOR_EMAIL);
    await page.locator('#phone').fill('08033344455');
    await page.locator('#dateOfBirth').fill('1990-05-15');
    await page.locator('#gender').selectOption('male');
    await page.locator('#address').fill('12 E2E Avenue, Victoria Island, Lagos');
    await page.locator('#password').fill(NEW_DOCTOR_PASSWORD);
    await page.locator('#confirmPassword').fill(NEW_DOCTOR_PASSWORD);

    // Doctor-specific fields
    await page.locator('#specialization').selectOption({ label: 'General Practice' }).catch(async () => {
      await page.locator('#specialization').selectOption('General Practice');
    });
    await page.locator('#licenseNumber, #license_number, #license').first().fill('LIC-E2E-001').catch(() => {});
    await page.locator('#licenseExpiryDate').fill('2035-12-31').catch(() => {});
    await page.locator('#state').selectOption('Lagos');
    await page.locator('#city').fill('Lagos');
    await page.locator('#consultationFee, #consultation_fee').first().fill('5000').catch(() => {});
    await page.locator('#yearsOfExperience, #years_of_experience').first().fill('5').catch(() => {});
    await page.locator('#qualifications').fill('MBBS, FWACS').catch(() => {});

    // Accept terms
    await page.locator('#terms').check().catch(() => {});

    // Submit
    await page.locator('button[type="submit"]').click();

    // After doctor registration → always redirected to /login (pending verification)
    await page.waitForURL(url => url.pathname.includes('/login'), { timeout: 15_000 })
      .catch(async () => {
        const err = await page.locator('[class*="error"], [role="alert"]').first().textContent().catch(() => 'no error');
        throw new Error(`Expected redirect to /login after doctor registration. Page error: ${err}`);
      });
  });
});

test.describe('Doctor portal (verified)', () => {
  test('verified doctor logs in and lands on the dashboard', async ({ page }) => {
    await loginAsDoctor(page);
    await expect(page).toHaveURL(/\/doctor/);
    await expect(page.locator('h1')).toContainText(/doctor dashboard/i, { timeout: 8_000 });
  });

  test('doctor dashboard renders stats cards', async ({ page }) => {
    await loginAsDoctor(page);

    // Wait for stats to load (not skeleton)
    await expect(
      page.locator("text=Today's Appointments, text=Total Patients").first()
    ).toBeVisible({ timeout: 10_000 }).catch(async () => {
      await expect(page.locator('[class*="card"]').first()).toBeVisible({ timeout: 10_000 });
    });
  });

  test('doctor can navigate to Consultations page', async ({ page }) => {
    await loginAsDoctor(page);

    await page.click('a[href="/doctor/consultations"]');
    await page.waitForURL('**/doctor/consultations', { timeout: 10_000 });
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 8_000 });
  });

  test('doctor can navigate to Prescriptions page', async ({ page }) => {
    await loginAsDoctor(page);

    await page.click('a[href="/doctor/prescriptions"]');
    await page.waitForURL('**/doctor/prescriptions', { timeout: 10_000 });
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 8_000 });
  });

  test('doctor sidebar has correct navigation links', async ({ page }) => {
    await loginAsDoctor(page);

    const navLinks = ['Dashboard', 'Consultations', 'Prescriptions', 'Payments', 'Statistics'];
    for (const label of navLinks) {
      await expect(page.locator(`nav >> text="${label}"`).first()).toBeVisible({ timeout: 5_000 });
    }
  });

  test('doctor can log out and is redirected to /login', async ({ page }) => {
    await loginAsDoctor(page);

    // Open user menu and click logout
    await page.locator('button', { hasText: /logout/i }).first().click()
      .catch(() => page.locator('[class*="menu"] button', { hasText: /logout/i }).click());

    await page.waitForURL('**/login', { timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated user visiting /doctor is redirected', async ({ page }) => {
    await page.goto('/doctor');
    await page.waitForURL(url => url.pathname.includes('/login') || url.pathname === '/', { timeout: 10_000 });
    expect(page.url()).not.toContain('/doctor/');
  });
});
