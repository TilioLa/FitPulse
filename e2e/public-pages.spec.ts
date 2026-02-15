import { expect, test } from '@playwright/test'

test('home page loads and has CTA', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Un coach clair, des séances efficaces/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /Commencez gratuitement/i })).toBeVisible()
})

test('pricing page is reachable', async ({ page }) => {
  await page.goto('/pricing')
  await expect(page.getByRole('heading', { name: /FitPulse est gratuit/i })).toBeVisible()
})
