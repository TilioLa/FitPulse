import { expect, test } from '@playwright/test'

test('dashboard workout flow persists draft and completes session', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('fitpulse_e2e_bypass', 'true')
  })
  await page.goto('/e2e/session')
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

  const completeWorkoutButton = page.getByTestId('complete-workout')
  for (let index = 0; index < 12; index += 1) {
    if (await completeWorkoutButton.isVisible()) break
    const nextButton = page.getByRole('button', { name: /Suivant/i })
    if (await nextButton.isVisible()) {
      await nextButton.click()
      continue
    }
    await page.waitForTimeout(150)
  }

  await expect(completeWorkoutButton).toBeVisible({ timeout: 15_000 })
  await completeWorkoutButton.click()
  await expect(page.getByRole('heading', { name: /Résumé de la séance/i })).toBeVisible({ timeout: 15_000 })

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
