import type { Page } from '@playwright/test'

export type E2ERole = 'owner' | 'admin' | 'member' | 'observer' | 'nobus' | 'suspended' | 'past_due'

const CREDENTIALS: Record<E2ERole, { email: string; password: string }> = {
  owner:     { email: 'owner@e2e.test',     password: 'E2eTest123!' },
  admin:     { email: 'admin@e2e.test',      password: 'E2eTest123!' },
  member:    { email: 'member@e2e.test',     password: 'E2eTest123!' },
  observer:  { email: 'observer@e2e.test',   password: 'E2eTest123!' },
  nobus:     { email: 'nobus@e2e.test',      password: 'E2eTest123!' },
  suspended: { email: 'suspended@e2e.test',  password: 'E2eTest123!' },
  past_due:  { email: 'past_due@e2e.test',   password: 'E2eTest123!' },
}

export async function loginAs(page: Page, role: E2ERole): Promise<void> {
  const { email, password } = CREDENTIALS[role]

  await page.goto('/login')
  await page.fill('input[name="email"], input[type="email"]', email)
  await page.fill('input[name="password"], input[type="password"]', password)
  await page.click('button[type="submit"]')

  // Esperar redirect — puede ir a /dashboard o /onboarding
  await page.waitForURL(/(dashboard|onboarding)/, { timeout: 10_000 })
}

export async function logout(page: Page): Promise<void> {
  // Buscar botón de logout en el sidebar
  const logoutBtn = page.getByRole('button', { name: /cerrar sesión/i })
  if (await logoutBtn.isVisible()) {
    await logoutBtn.click()
    await page.waitForURL('**/login**', { timeout: 5_000 })
  }
}
