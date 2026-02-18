import { test, expect } from '@playwright/test'

test('connexion links to inscription', async ({ page }) => {
  await page.goto('/connexion')
  await expect(page.getByRole('heading', { name: /connexion/i })).toBeVisible()
  await page.getByRole('link', { name: /créer un compte/i }).click()
  await expect(page).toHaveURL(/\/inscription$/)
  await expect(page.getByRole('heading', { name: /créer un compte/i })).toBeVisible()
})

test('inscription validates password confirmation', async ({ page }) => {
  await page.goto('/inscription')

  await page.getByLabel('Email *').fill('qa-fitpulse@example.com')
  await page.getByLabel(/^Mot de passe \*$/).fill('abcdef')
  await page.getByLabel(/^Confirmer le mot de passe \*$/).fill('abcdeg')
  await page.getByRole('button', { name: /créer mon compte/i }).click()

  await expect(page.getByRole('alert')).toContainText(/mots de passe ne correspondent pas/i)
})

test('settings saves profile fields locally', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('fitpulse_e2e_bypass', 'true')
  })
  await page.goto('/dashboard?view=settings')
  await expect(page.getByRole('heading', { name: /paramètres/i })).toBeVisible()

  const updatedName = `QA User ${Date.now()}`
  await page.getByLabel('Nom complet').fill(updatedName)
  await page.getByRole('button', { name: /sauvegarder les paramètres/i }).click()

  await expect(page.getByRole('status')).toContainText(/paramètres sauvegardés/i)

  const savedName = await page.evaluate(() => {
    const raw = localStorage.getItem('fitpulse_settings')
    if (!raw) return null
    try {
      return (JSON.parse(raw) as { name?: string }).name ?? null
    } catch {
      return null
    }
  })

  expect(savedName).toBe(updatedName)
})
