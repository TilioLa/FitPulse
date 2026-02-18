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

  await expect(
    page.getByRole('alert').filter({ hasText: /mots de passe ne correspondent pas/i })
  ).toBeVisible()
})

test('settings saves profile fields locally', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    window.localStorage.setItem('fitpulse_e2e_bypass', 'true')
  })
  await page.goto('/dashboard?view=settings&e2e=1')
  await page.waitForURL(/\/dashboard(\?.*)?/, { timeout: 15_000 })
  if (!page.url().includes('view=settings')) {
    await page.goto('/dashboard?view=settings&e2e=1')
  }
  const settingsHeading = page.getByRole('heading', { name: /paramètres/i })
  await expect(settingsHeading).toBeVisible({ timeout: 15_000 })

  const nameInput = page.getByLabel('Nom complet')
  if (!(await nameInput.isVisible().catch(() => false))) {
    const settingsNav = page.getByRole('button', { name: /paramètres/i }).first()
    if (await settingsNav.isVisible().catch(() => false)) {
      await settingsNav.click()
    }
  }
  await expect(nameInput).toBeVisible({ timeout: 15_000 })

  const updatedName = `QA User ${Date.now()}`
  await nameInput.click()
  await nameInput.press('ControlOrMeta+A')
  await nameInput.press('Backspace')
  await nameInput.fill(updatedName)
  await page.getByRole('button', { name: /sauvegarder les paramètres/i }).click()

  await expect(
    page.getByRole('status').filter({ hasText: /paramètres sauvegardés/i }).first()
  ).toBeVisible()

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
