import { test, expect } from '@playwright/test'

test('connexion links to inscription', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
  })
  await page.context().clearCookies()
  await page.goto('/connexion')
  await expect(page.getByRole('heading', { name: /connexion/i })).toBeVisible()
  const signupLink = page.getByRole('link', { name: /créer un compte/i })
  await expect(signupLink).toHaveAttribute('href', '/inscription')
  await page.goto('/inscription')
  await expect(page).toHaveURL(/\/inscription$/)
  await expect(page.getByRole('heading', { name: /créer un compte/i })).toBeVisible()
})

test('inscription validates password confirmation', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
  })
  await page.context().clearCookies()
  await page.goto('/inscription')

  await page.getByLabel('Email *').fill('qa-fitpulse@example.com')
  await page.getByLabel(/^Mot de passe \*$/).fill('abcdef')
  await page.getByLabel(/^Confirmer le mot de passe \*$/).fill('abcdeg')
  await page.getByRole('button', { name: /créer mon compte/i }).click()

  await expect(
    page.getByRole('alert').filter({ hasText: /mots de passe ne correspondent pas/i })
  ).toBeVisible()
})

test('settings saves profile fields locally', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    window.localStorage.setItem('fitpulse_e2e_bypass', 'true')
  })
  await page.goto('/settings?e2e=1')
  await page.waitForURL(/\/settings(\?.*)?/, { timeout: 15_000 })
  const settingsHeading = page.getByRole('heading', { name: /paramètres/i })
  await expect(settingsHeading).toBeVisible({ timeout: 15_000 })

  const nameInput = page.getByLabel('Nom complet')
  await expect(nameInput).toBeVisible({ timeout: 15_000 })

  const updatedName = `QA User ${Date.now()}`
  await nameInput.click()
  await nameInput.press('ControlOrMeta+A')
  await nameInput.press('Backspace')
  await nameInput.fill(updatedName)
  await page.getByRole('button', { name: /sauvegarder les paramètres/i }).click()
  await expect
    .poll(async () => {
      return page.evaluate(() => {
        const raw = localStorage.getItem('fitpulse_settings')
        if (!raw) return null
        try {
          return (JSON.parse(raw) as { name?: string }).name ?? null
        } catch {
          return null
        }
      })
    }, { timeout: 20_000 })
    .toBe(updatedName)
})
