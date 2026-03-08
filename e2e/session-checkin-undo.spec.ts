import { expect, test } from '@playwright/test'

test('session check-in applies adjustment and persists in draft', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('fitpulse_e2e_bypass', 'true')
  })
  await page.goto('/e2e/session')
  await expect(page.getByTestId('session-root')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByTestId('session-checkin')).toBeVisible({ timeout: 15_000 })

  await page.getByTestId('checkin-apply').click()

  await expect(page.getByText(/Ajustement (appliqué|ignoré)/i)).toBeVisible({ timeout: 15_000 })

  await expect
    .poll(async () => {
      return page.evaluate(() => {
        const raw = localStorage.getItem('fitpulse_current_workout')
        if (!raw) return false
        const parsed = JSON.parse(raw)
        return Boolean(parsed?.draft?.checkIn?.completed) && String(parsed?.draft?.checkIn?.recommendation || '').length > 0
      })
    })
    .toBeTruthy()
})

test('session can undo the last completed set', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('fitpulse_e2e_bypass', 'true')
  })
  await page.goto('/e2e/session')
  await expect(page.getByTestId('session-root')).toBeVisible({ timeout: 15_000 })

  await page.getByTestId('mark-next-set').click()
  await expect(page.getByTestId('undo-last-set')).toBeEnabled({ timeout: 15_000 })
  await page.getByTestId('undo-last-set').click()

  await expect(page.getByTestId('undo-last-set')).toBeDisabled({ timeout: 15_000 })

  await expect
    .poll(async () => {
      return page.evaluate(() => {
        const raw = localStorage.getItem('fitpulse_current_workout')
        if (!raw) return false
        const parsed = JSON.parse(raw)
        const exerciseInputs = parsed?.draft?.exerciseInputs
        if (!exerciseInputs) return false
        const firstExerciseId = Object.keys(exerciseInputs)[0]
        const firstSet = exerciseInputs[firstExerciseId]?.[0]
        return firstSet?.completed === false
      })
    })
    .toBeTruthy()
})
