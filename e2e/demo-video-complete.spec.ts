import { expect, test } from '@playwright/test'

test.use({
  video: {
    mode: 'on',
    size: { width: 1920, height: 1080 },
  },
  viewport: { width: 1920, height: 1080 },
})

async function cinematicPause(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function cinematicScroll(page: { mouse: { wheel: (x: number, y: number) => Promise<void> } }) {
  await page.mouse.wheel(0, 700)
  await cinematicPause(1200)
  await page.mouse.wheel(0, 700)
  await cinematicPause(1200)
  await page.mouse.wheel(0, -500)
  await cinematicPause(900)
}

test('record complete site walkthrough ~1 minute', async ({ page }) => {
  test.setTimeout(120_000)

  await page.goto('/')
  await expect(page.getByRole('heading', { name: /un coach clair, des séances efficaces/i })).toBeVisible()
  await cinematicPause(2600)
  await cinematicScroll(page)

  await page.goto('/programmes')
  await expect(page.getByRole('heading', { name: /tous nos programmes/i })).toBeVisible()
  await cinematicPause(2200)
  await cinematicScroll(page)

  await page.goto('/dashboard?view=feed')
  await expect(page).toHaveURL(/\/dashboard/)
  await cinematicPause(2300)
  await cinematicScroll(page)

  await page.goto('/dashboard?view=programs')
  await cinematicPause(1800)
  await cinematicScroll(page)

  await page.goto('/dashboard?view=routines')
  await cinematicPause(1800)
  await cinematicScroll(page)

  await page.goto('/dashboard?view=session')
  await cinematicPause(1800)
  await cinematicScroll(page)

  await page.goto('/exercices')
  await expect(page.getByRole('heading', { name: /exercices/i })).toBeVisible()
  await cinematicPause(2000)
  await page.getByRole('button', { name: /curl/i }).first().click()
  await cinematicPause(1300)
  await page.getByRole('button', { name: /historique/i }).first().click()
  await cinematicPause(1500)
  await page.getByRole('button', { name: /instructions/i }).first().click()
  await cinematicPause(1700)

  await page.goto('/profil?view=history')
  await expect(page).toHaveURL(/\/profil/)
  await cinematicPause(1800)
  await cinematicScroll(page)
  await page.goto('/profil?view=progress')
  await cinematicPause(1600)

  await page.goto('/settings')
  await expect(page).toHaveURL(/\/settings/)
  await cinematicPause(2200)
  await cinematicScroll(page)

  await page.goto('/aide')
  await expect(page.getByRole('heading', { name: /centre d'aide/i })).toBeVisible()
  await cinematicPause(1800)
  await cinematicScroll(page)

  await page.goto('/contact')
  await expect(page.getByRole('heading', { name: /nous contacter/i })).toBeVisible()
  await cinematicPause(2600)
})
