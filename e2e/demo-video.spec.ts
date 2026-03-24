import { expect, test } from '@playwright/test'

test.use({
  video: 'on',
  viewport: { width: 1440, height: 900 },
})

test('record marketing walkthrough', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /un coach clair, des séances efficaces/i })).toBeVisible()
  await page.waitForTimeout(700)

  await page.getByText('Visite guidée').first().click()
  await expect(page).toHaveURL(/\/dashboard\?tour=1/)
  await expect(page.getByText(/visite guidée 1\/3/i)).toBeVisible()
  await page.waitForTimeout(900)

  await page.getByRole('button', { name: /suivant/i }).click()
  await expect(page.getByText(/visite guidée 2\/3/i)).toBeVisible()
  await page.waitForTimeout(900)

  await page.getByRole('button', { name: /suivant/i }).click()
  await expect(page.getByText(/visite guidée 3\/3/i)).toBeVisible()
  await page.waitForTimeout(900)

  const signupOrFinish = page.getByRole('button', { name: /s'inscrire|terminer/i })
  await signupOrFinish.click()
  await page.waitForTimeout(900)

  if (page.url().includes('/inscription')) {
    await expect(page.getByRole('heading', { name: /créer un compte/i })).toBeVisible()
    await page.locator('#name').fill('Alex Demo')
    await page.locator('#email').fill('alex.demo@example.com')
    await page.waitForTimeout(1200)
  } else {
    await expect(page).toHaveURL(/\/dashboard/)
    await page.waitForTimeout(1200)
  }
})
