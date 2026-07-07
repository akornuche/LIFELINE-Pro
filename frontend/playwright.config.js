// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration for LifeLine Pro
 *
 * Tests run against a live Vite dev server (frontend) + Express backend.
 *
 * Defaults:
 *   - baseURL: http://localhost:5173  (Vite default port)
 *   - API:     http://localhost:5002  (test backend port, set via env)
 *   - Browser: Chromium headless
 *
 * Start order: backend first (webServer[0]), then frontend (webServer[1]).
 * Playwright waits for each server to be ready before running tests.
 *
 * Run:
 *   npm run test:e2e               # headless
 *   npm run test:e2e:headed        # with browser window
 *   npm run test:e2e:debug         # pause on failures (Playwright Inspector)
 */

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.js',

  // Allow 30s per test (registration + DB setup can be slow)
  timeout: 30_000,

  // Retry once on CI to absorb flakiness
  retries: process.env.CI ? 1 : 0,

  // Run tests sequentially to avoid DB race conditions
  workers: 1,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  use: {
    baseURL: 'http://localhost:3000',
    // Keep test artifacts on failure
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    headless: true,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Start backend (SQLite test mode) then Vite dev server before running E2E
  webServer: [
    {
      // Backend: run in E2E-test mode (isolated SQLite, port 5002)
      command: 'node ../backend/scripts/e2e-server.js',
      cwd: process.cwd(),
      url: 'http://localhost:5002/ping',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      // Frontend: Vite dev server (uses proxy to forward /api → port 5002)
      command: 'npm run dev',
      cwd: process.cwd(),
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
});
