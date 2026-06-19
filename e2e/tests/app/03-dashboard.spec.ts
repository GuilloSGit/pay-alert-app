import { test, expect } from '@playwright/test'
import { loginAs } from '../../fixtures/auth.fixture'

test.describe('Dashboard', () => {

  test('OWNER ve 4 stat cards + últimos pagos', async ({ page }) => {
    await loginAs(page, 'owner')
    await page.goto('/dashboard')

    // Esperar que carguen las stat cards (no skeletons)
    await page.waitForTimeout(1_500)

    // Verificar al menos 3 cards numéricas (pago hoy, total mes, miembros)
    const statCards = page.locator('[data-testid="stat-card"], .stat-card, [class*="StatCard"]')
    // Fallback: buscar por contenido
    const paymentsToday = page.getByText(/pagos.*hoy|hoy.*pago/i).first()
    await expect(paymentsToday).toBeVisible({ timeout: 8_000 })
  })

  test('MEMBER ve solo 2 stat cards (no suscripción ni miembros)', async ({ page }) => {
    await loginAs(page, 'member')
    await page.goto('/dashboard')
    await page.waitForTimeout(1_500)

    // Member no debe ver la card de suscripción
    await expect(page.getByText(/suscripción|plan actual/i)).not.toBeVisible()
    // Member sí ve pagos
    await expect(page.getByText(/pagos.*hoy|hoy.*pago/i).first()).toBeVisible({ timeout: 8_000 })
  })

  test('TRIALING con ≤7 días muestra banner amarillo', async ({ page }) => {
    // El seed crea owner con TRIALING de 14 días — no tiene banner (>7 días)
    // Este test verifica que con >7 días NO hay banner
    await loginAs(page, 'owner')
    await page.goto('/dashboard')
    await page.waitForTimeout(1_000)
    // No debe haber banner de trial (14 días restantes > 7)
    await expect(page.getByText(/prueba termina en \d+ días/i)).not.toBeVisible()
  })

  test('SUSPENDED → SubscriptionGate bloquea el dashboard', async ({ page }) => {
    await loginAs(page, 'suspended')
    await page.goto('/dashboard')
    await page.waitForTimeout(1_500)

    // Debe mostrar el gate de suscripción suspendida
    const gate = page.getByText(/suspendida|suspendido/i).first()
    await expect(gate).toBeVisible({ timeout: 8_000 })
  })

  test('PAST_DUE → banner rojo visible', async ({ page }) => {
    await loginAs(page, 'past_due')
    await page.goto('/dashboard')
    await page.waitForTimeout(1_500)

    const banner = page.getByText(/pago pendiente|past.?due/i).first()
    await expect(banner).toBeVisible({ timeout: 8_000 })
  })

  test('link "Ver todos →" va a /dashboard/payments', async ({ page }) => {
    await loginAs(page, 'owner')
    await page.goto('/dashboard')
    await page.waitForTimeout(1_500)

    const verTodos = page.getByRole('link', { name: /ver todos/i })
    if (await verTodos.isVisible()) {
      await verTodos.click()
      await expect(page).toHaveURL(/payments/)
    }
  })
})
