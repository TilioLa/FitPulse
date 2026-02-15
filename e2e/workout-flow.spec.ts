import { expect, test } from '@playwright/test'

test('dashboard workout flow persists draft and completes session', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('fitpulse_e2e_bypass', 'true')
  })
  await page.goto('/dashboard?view=session')
  await expect(page.getByTestId('session-root')).toBeVisible({ timeout: 15_000 })

  await page.getByTestId('mark-next-set').click()

  await expect
    .poll(async () => {
      return page.evaluate(() => {
        const raw = localStorage.getItem('fitpulse_current_workout')
        if (!raw) return false
        const parsed = JSON.parse(raw)
        return Boolean(parsed?.draft?.savedAt && parsed?.draft?.exerciseInputs)
      })
    })
    .toBeTruthy()

  await page.getByTestId('complete-workout').click()
  await expect(page).toHaveURL(/dashboard\?view=feed/, { timeout: 15_000 })

  await expect
    .poll(async () => {
      return page.evaluate(() => {
        const raw = localStorage.getItem('fitpulse_history')
        const history = raw ? JSON.parse(raw) : []
        return Array.isArray(history) && history.length > 0
      })
    })
    .toBeTruthy()
})
