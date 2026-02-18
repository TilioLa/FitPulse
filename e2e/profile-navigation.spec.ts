import { expect, test } from '@playwright/test'

test('dashboard sidebar links to profile page', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.setItem('fitpulse_e2e_bypass', 'true')
  })

  await page.goto('/dashboard?view=feed&e2e=1')
  await expect(page.getByRole('link', { name: /^profil$/i })).toBeVisible({ timeout: 15_000 })
  await page.getByRole('link', { name: /^profil$/i }).click()

  await expect(page).toHaveURL(/\/profil$/, { timeout: 15_000 })
  await expect(page.getByRole('heading', { name: /e2e user|utilisateur fitpulse/i })).toBeVisible({
    timeout: 15_000,
  })
})
