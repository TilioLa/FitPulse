import { expect, test } from '@playwright/test'

test('restores in-progress workout draft after reload', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('fitpulse_e2e_bypass', 'true')
  })
  await page.goto('/dashboard?view=session&e2e=1')
  await expect(page.getByTestId('session-root')).toBeVisible({ timeout: 15_000 })

  await page.getByTestId('mark-next-set').click()

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
        return Boolean(firstSet?.completed)
      })
    })
    .toBeTruthy()

  await page.reload()
  await expect(page.getByTestId('session-root')).toBeVisible({ timeout: 15_000 })

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
        return Boolean(firstSet?.completed)
      })
    })
    .toBeTruthy()
})
