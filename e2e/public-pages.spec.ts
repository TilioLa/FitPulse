import { expect, test } from '@playwright/test'

test('home page loads and has CTA', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/$/, { timeout: 15_000 })
  await expect(page.getByRole('heading', { name: /Un coach clair, des séances efficaces/i })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('link', { name: /Commencez gratuitement/i })).toBeVisible({ timeout: 15_000 })
})

test('pricing page redirects to programmes', async ({ page }) => {
  const response = await page.goto('/pricing')
  expect(response?.status()).toBe(200)
  await expect(page).toHaveURL(/\/programmes\/?$/, { timeout: 15_000 })
  await expect(page.getByRole('heading', { name: /Programmes|Programmes FitPulse/i })).toBeVisible({ timeout: 15_000 })
})
