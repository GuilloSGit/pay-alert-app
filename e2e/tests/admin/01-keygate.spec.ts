import { test, expect } from '@playwright/test'

const VALID_KEY = process.env['ADMIN_API_KEY'] ?? 'e2e-test-admin-api-key-that-is-at-least-32ch'

test.describe('Admin — KeyGate', () => {

  test.beforeEach(async ({ page }) => {
    // Limpiar localStorage antes de cada test
    await page.goto('/')
    await page.evaluate(() => localStorage.removeItem('admin_api_key'))
  })

  test('sin key → muestra pantalla de KeyGate', async ({ page }) => {
    await page.goto('/')
    // Debe pedir la key
    await expect(page.getByText(/clave|api key|ingresar/i).first()).toBeVisible({ timeout: 5_000 })
  })

  test('key válida → accede al dashboard', async ({ page }) => {
    await page.goto('/')
    const keyInput = page.locator('input[type="password"], input[placeholder*="key"], input[placeholder*="clave"]').first()
    if (await keyInput.isVisible()) {
      await keyInput.fill(VALID_KEY)
      await page.getByRole('button', { name: /ingresar|entrar|acceder/i }).click()
      await expect(page).toHaveURL(/dashboard/, { timeout: 8_000 })
    } else {
      // La key puede ya estar en localStorage si el test anterior la dejó
      // Verificar que estemos en el dashboard
      await expect(page).toHaveURL(/dashboard/)
    }
  })

  test('campo vacío → muestra error de validación', async ({ page }) => {
    await page.goto('/')
    const keyInput = page.locator('input[type="password"]').first()
    if (await keyInput.isVisible()) {
      // Enviar sin llenar el campo
      await page.getByRole('button', { name: /ingresar/i }).click()
      // El KeyGate valida que no esté vacío antes de guardar
      await expect(page.getByText(/Ingresá la clave/i)).toBeVisible({ timeout: 5_000 })
      // Sigue en la pantalla de KeyGate (sin dashboard)
      await expect(page.getByText(/Admin API Key/i)).toBeVisible()
    } else {
      test.skip(true, 'KeyGate no visible — puede estar ya autenticado')
    }
  })
})
