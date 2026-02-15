import { expect, test } from '@playwright/test'

test('home page loads and has CTA', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Votre coach sportif personnel/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /Commencer maintenant/i })).toBeVisible()
})

test('pricing page is reachable', async ({ page }) => {
  await page.goto('/pricing')
  await expect(page.getByRole('heading', { name: /Tarifs simples et transparents/i })).toBeVisible()
})
