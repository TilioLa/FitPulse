import { expect, test } from '@playwright/test'

const email = process.env.E2E_USER_EMAIL
const password = process.env.E2E_USER_PASSWORD

test.describe('real auth (supabase)', () => {
  test.skip(!email || !password, 'E2E_USER_EMAIL/E2E_USER_PASSWORD not configured')

  test('can login and access dashboard', async ({ page }) => {
    await page.goto('/connexion')
    await page.getByLabel(/Email/i).fill(email as string)
    await page.getByLabel(/Mot de passe/i).fill(password as string)
    await page.getByRole('button', { name: /Se connecter/i }).click()

    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByText(/Home/i)).toBeVisible()
  })
})
