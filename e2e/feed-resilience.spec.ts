import { expect, test } from '@playwright/test'

test('dashboard feed survives corrupted local storage payloads', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.setItem('fitpulse_e2e_bypass', 'true')
    localStorage.setItem('fitpulse_history', '{invalid-json')
    localStorage.setItem('fitpulse_current_workout', '{invalid-json')
    localStorage.setItem('fitpulse_settings', '{invalid-json')
  })

  await page.goto('/dashboard?view=feed&e2e=1')
  await expect(page.getByRole('heading', { name: /^(home|tableau de bord)$/i })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText(/complète ton profil/i)).toBeVisible({ timeout: 15_000 })
})
