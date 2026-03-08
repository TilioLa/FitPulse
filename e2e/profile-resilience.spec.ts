import { expect, test } from '@playwright/test'

test('profile page survives corrupted history storage', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.setItem('fitpulse_e2e_bypass', 'true')
    localStorage.setItem('fitpulse_history', '{invalid-json')
  })

  await page.goto('/profil')
  await expect(page).toHaveURL(/\/profil$/, { timeout: 15_000 })
  await expect(
    page.getByRole('heading', { name: /e2e user|utilisateur fitpulse/i })
  ).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText(/aucune séance enregistrée/i)).toBeVisible({ timeout: 15_000 })
})
