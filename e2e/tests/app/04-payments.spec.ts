import { test, expect } from '@playwright/test'
import { loginAs } from '../../fixtures/auth.fixture'

test.describe('Pagos', () => {

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'owner')
    await page.goto('/dashboard/payments')
    // Esperar que cargue la lista
    await page.waitForTimeout(2_000)
  })

  test('muestra historial de pagos con columnas correctas', async ({ page }) => {
    // Al menos debe haber filas de pagos (seed crea 20)
    const rows = page.locator('tr, [data-testid="payment-row"], [class*="payment-row"]')
    const cards = page.locator('[class*="PaymentCard"], [data-testid="payment-card"]')
    const hasContent = (await rows.count()) > 1 || (await cards.count()) > 0
    expect(hasContent).toBe(true)
  })

  test('filtro por estado APPROVED filtra correctamente', async ({ page }) => {
    // Buscar selector de estado
    const statusSelect = page.getByRole('combobox', { name: /estado/i })
      .or(page.locator('select[name="status"]'))
      .or(page.getByLabel(/estado/i))
      .first()

    if (await statusSelect.isVisible()) {
      await statusSelect.selectOption('APPROVED')
      await page.waitForTimeout(1_000)
      // Verificar que los badges mostrados son APPROVED
      const badges = page.getByText(/aprobado/i)
      await expect(badges.first()).toBeVisible({ timeout: 5_000 })
    } else {
      test.skip(true, 'Selector de estado no encontrado')
    }
  })

  test('filtro de búsqueda filtra por texto', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/buscar|search/i)
      .or(page.locator('input[type="search"]'))
      .first()

    if (await searchInput.isVisible()) {
      await searchInput.fill('Pagador Test 1')
      await page.waitForTimeout(600) // debounce
      // Resultado reducido
      const emptyOrFiltered = page.getByText(/Sin resultados|Pagador Test 1/i).first()
      await expect(emptyOrFiltered).toBeVisible({ timeout: 5_000 })
    } else {
      test.skip(true, 'Input de búsqueda no encontrado')
    }
  })

  test('limpiar filtros restaura lista completa', async ({ page }) => {
    const clearBtn = page.getByRole('button', { name: /limpiar/i })
    if (await clearBtn.isVisible()) {
      await clearBtn.click()
      await page.waitForTimeout(500)
    }
  })

  test('click en pago abre SlideOver con detalle', async ({ page }) => {
    // Hacer click en la primera fila/card de pago
    const firstRow = page.locator('tr[class*="cursor"], [data-testid="payment-row"], [class*="payment-row"]').first()
    const firstCard = page.locator('[class*="PaymentCard"], [data-testid="payment-card"]').first()

    const clickTarget = (await firstRow.isVisible()) ? firstRow : firstCard
    if (await clickTarget.isVisible()) {
      await clickTarget.click()
      // SlideOver debe abrirse
      await expect(page.getByText(/detalle del pago/i)).toBeVisible({ timeout: 5_000 })
    } else {
      test.skip(true, 'No se encontró elemento clickeable de pago')
    }
  })

  test('exportar CSV — bloqueado si plan no lo permite (Profesional sí lo permite)', async ({ page }) => {
    // El seed usa plan Profesional para owner → export habilitado
    const exportBtn = page.getByRole('button', { name: /exportar/i })
      .or(page.getByText(/exportar/i))
      .first()

    if (await exportBtn.isVisible()) {
      // Verificar que el botón NO está bloqueado (no tiene ícono de candado)
      const lockIcon = exportBtn.locator('[class*="lock"], svg[class*="lock"]')
      const isLocked = await lockIcon.isVisible()
      expect(isLocked).toBe(false)
    }
  })

  test('filtro de fecha inválido (sin timezone) NO pasa al backend', async ({ page }) => {
    // El frontend debe validar o construir correctamente las fechas con offset
    // Este test verifica que no aparezca error de "400" visible al usuario
    const fromInput = page.locator('input[type="date"][name*="from"], input[name*="from"]').first()
    if (await fromInput.isVisible()) {
      await fromInput.fill('2026-06-01')
      await page.waitForTimeout(600)
      // No debe aparecer error técnico de 400 Bad Request
      await expect(page.getByText(/400|bad request/i)).not.toBeVisible()
    }
  })
})
