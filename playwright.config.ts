import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e/tests',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false, // secuencial para evitar conflictos de sesión
  retries: 1,

  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-results.json' }],
    ['list'],
  ],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    locale: 'es-AR',
    timezoneId: 'America/Argentina/Buenos_Aires',
  },

  projects: [
    {
      name: 'app',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3000',
      },
      testMatch: 'app/**/*.spec.ts',
    },
    {
      name: 'admin',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3003',
      },
      testMatch: 'admin/**/*.spec.ts',
    },
  ],

  globalSetup: './e2e/global-setup.ts',
})
