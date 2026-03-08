import { expect, test } from '@playwright/test'

test('reset update validates password mismatch', async ({ page }) => {
  await page.goto('/reset/update')
  await page.getByLabel('Nouveau mot de passe').fill('abcdef')
  await page.getByLabel('Confirmer le mot de passe').fill('abcdeg')
  await page.getByRole('button', { name: /mettre à jour/i }).click()
  await expect(page.getByRole('status')).toContainText(/ne correspondent pas/i)
})

test('share page handles invalid token with fallback UI', async ({ page }) => {
  await page.goto('/share?s=invalid-token')
  await expect(page.getByRole('heading', { name: /lien invalide/i })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('heading', { name: /top profils/i })).toBeVisible({ timeout: 15_000 })
})
