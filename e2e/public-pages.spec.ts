import { expect, test } from '@playwright/test'

test('home page loads and has CTA', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/(connexion)?$/, { timeout: 15_000 })
  await expect(page.getByRole('heading', { name: /Connexion/i })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('link', { name: /Créer un compte/i })).toBeVisible({ timeout: 15_000 })
})

test('pricing page is reachable', async ({ page }) => {
  await page.goto('/pricing')
  await expect(page.getByRole('heading', { name: /FitPulse est gratuit/i })).toBeVisible({ timeout: 15_000 })
})
