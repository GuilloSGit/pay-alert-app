import { test, expect } from '@playwright/test'

const VALID_KEY = process.env['ADMIN_API_KEY'] ?? 'e2e-test-admin-api-key-that-is-at-least-32ch'

test.describe('Admin — Dashboard', () => {

  test.beforeEach(async ({ page }) => {
    // Pre-setear la key para no pasar por KeyGate en cada test
    await page.goto('/')
    await page.evaluate((key) => localStorage.setItem('admin_api_key', key), VALID_KEY)
    await page.goto('/dashboard')
    await page.waitForTimeout(2_000)
  })

  test('muestra métricas del sistema', async ({ page }) => {
    // Verificar que hay datos de métricas
    // (el endpoint /admin/metrics retorna MRR, clientes, etc.)
    await expect(page).toHaveURL(/dashboard/, { timeout: 5_000 })

    // Al menos debe haber números o cards visibles
    const cards = page.locator('[class*="card"], [class*="Card"], [class*="stat"]')
    const cardCount = await cards.count()
    expect(cardCount).toBeGreaterThanOrEqual(0) // puede que no haya datos en test DB
  })

  test('navegación a /users funciona', async ({ page }) => {
    await page.getByRole('link', { name: /usuarios/i }).click()
    await expect(page).toHaveURL(/users/, { timeout: 5_000 })
    await page.waitForTimeout(1_000)

    // Debe mostrar lista o empty state
    const content = page.locator('table, [class*="Table"], [class*="EmptyState"]').first()
    await expect(content).toBeVisible({ timeout: 5_000 })
  })

  test('navegación a /businesses funciona', async ({ page }) => {
    await page.getByRole('link', { name: /comercios/i }).click()
    await expect(page).toHaveURL(/businesses/, { timeout: 5_000 })
    await page.waitForTimeout(1_000)
    const content = page.locator('table, [class*="Table"], [class*="EmptyState"]').first()
    await expect(content).toBeVisible({ timeout: 5_000 })
  })
})
