import { expect, test } from '@playwright/test'

test('home page loads and has CTA', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/$/, { timeout: 15_000 })
  await expect(page.getByRole('heading', { name: /Ton coach visuel pour transformer ta régularité/i })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('link', { name: /Démarrer mon plan gratuit/i })).toBeVisible({ timeout: 15_000 })
})

test('pricing page redirects to programs', async ({ page }) => {
  await page.goto('/pricing')
  await expect(page).toHaveURL(/\/programmes$/, { timeout: 15_000 })
  await expect(page.getByRole('heading', { name: /Tous nos programmes/i })).toBeVisible({ timeout: 15_000 })
})
