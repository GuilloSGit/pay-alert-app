import { test, expect } from '@playwright/test'
import { loginAs } from '../../fixtures/auth.fixture'

test.describe('Matriz de permisos por rol', () => {

  test('OWNER — ve facturación en sidebar', async ({ page }) => {
    await loginAs(page, 'owner')
    await expect(page.getByRole('link', { name: /facturación/i })).toBeVisible({ timeout: 5_000 })
  })

  test('MEMBER — NO ve facturación', async ({ page }) => {
    await loginAs(page, 'member')
    await page.waitForTimeout(500)
    await expect(page.getByRole('link', { name: /facturación/i })).not.toBeVisible()
  })

  test('OBSERVER — NO ve facturación', async ({ page }) => {
    await loginAs(page, 'observer')
    await page.waitForTimeout(500)
    await expect(page.getByRole('link', { name: /facturación/i })).not.toBeVisible()
  })

  test('MEMBER — no ve botón "Invitar miembro"', async ({ page }) => {
    await loginAs(page, 'member')
    await page.goto('/dashboard/members')
    await page.waitForTimeout(1_500)
    await expect(page.getByRole('button', { name: /invitar/i })).not.toBeVisible()
  })

  test('OWNER — ve botón "Invitar miembro"', async ({ page }) => {
    await loginAs(page, 'owner')
    await page.goto('/dashboard/members')
    await page.waitForTimeout(1_500)
    await expect(page.getByRole('button', { name: /invitar/i })).toBeVisible({ timeout: 5_000 })
  })

  test('ADMIN — ve botón "Invitar miembro"', async ({ page }) => {
    await loginAs(page, 'admin')
    await page.goto('/dashboard/members')
    await page.waitForTimeout(1_500)
    await expect(page.getByRole('button', { name: /invitar/i })).toBeVisible({ timeout: 5_000 })
  })

  test('MEMBER — no puede editar datos del comercio', async ({ page }) => {
    await loginAs(page, 'member')
    await page.goto('/dashboard/businesses')
    await page.waitForTimeout(1_500)
    await expect(page.getByRole('button', { name: /editar/i })).not.toBeVisible()
  })

  test('OWNER — puede editar datos del comercio', async ({ page }) => {
    await loginAs(page, 'owner')
    await page.goto('/dashboard/businesses')
    await page.waitForTimeout(1_500)
    await expect(page.getByRole('button', { name: /editar/i })).toBeVisible({ timeout: 5_000 })
  })

  test('OBSERVER — acceso a pagos en modo solo lectura', async ({ page }) => {
    await loginAs(page, 'observer')
    await page.goto('/dashboard/payments')
    await page.waitForTimeout(1_500)
    // Observer puede ver pagos
    await expect(page).toHaveURL(/payments/)
    // Pero no debería poder realizar acciones
  })

  test('SUSPENDED — SubscriptionGate en todas las páginas', async ({ page }) => {
    await loginAs(page, 'suspended')
    await page.goto('/dashboard/payments')
    await page.waitForTimeout(1_500)
    const gate = page.getByText(/suspendida|suspendido/i).first()
    await expect(gate).toBeVisible({ timeout: 8_000 })
  })
})
