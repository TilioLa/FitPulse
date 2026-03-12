import { test, expect } from '@playwright/test'

function trackPageErrors(page: any) {
  const errors: string[] = []
  page.on('pageerror', (err: Error) => {
    errors.push(`pageerror: ${err.message}`)
  })
  page.on('console', (msg: any) => {
    if (msg.type() === 'error') {
      errors.push(`console: ${msg.text()}`)
    }
  })
  return errors
}

test('ordered user journey: inscription -> programme -> seance -> historique', async ({ page }) => {
  const errors = trackPageErrors(page)

  await page.addInitScript(() => {
    window.localStorage.setItem('fitpulse_e2e_bypass', 'true')
  })

  // 1) Home
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Un coach clair, des séances efficaces' })).toBeVisible()
  await page.getByRole('link', { name: 'Commencez gratuitement' }).click()

  // 2) Inscription (validation only)
  await expect(page).toHaveURL(/\/inscription/)
  await page.getByLabel('Email *').fill('test-user@example.com')
  await page.locator('#password').fill('secret1')
  await page.locator('#confirmPassword').fill('secret2')
  await page.getByRole('button', { name: 'Créer mon compte' }).click()
  await expect(page.getByText('Les mots de passe ne correspondent pas')).toBeVisible()

  // 3) Choix programme
  await page.goto('/programmes')
  await expect(page.getByRole('heading', { name: 'Tous nos programmes' })).toBeVisible()
  await page.getByRole('link', { name: 'Débutant - Poids du corps' }).first().click()

  // 4) Séance
  await expect(page).toHaveURL(/\/programmes\//)
  await page.getByRole('link', { name: /Démarrer la prochaine séance/i }).first().click()
  await expect(page).toHaveURL(/\/programmes\/.*\/seances\//)
  await page.getByRole('link', { name: /Démarrer la séance/i }).click()
  await expect(page).toHaveURL(/\/dashboard\?view=session/)

  // 5) Historique
  await page.getByRole('button', { name: /Historique|History/ }).click()
  await expect(page.getByRole('heading', { name: /Historique des séances|Session history/ })).toBeVisible()

  await page.getByLabel('Date de début').fill('2023-01-01')
  await page.getByLabel('Date de fin').fill('2023-02-01')
  await expect(page.getByLabel('Date de début')).toHaveValue('2023-01-01')
  await expect(page.getByLabel('Date de fin')).toHaveValue('2023-02-01')

  await page.goto('/profil')
  await expect(page.getByText('Historique récent')).toBeVisible()
  await expect(page.getByRole('button', { name: /Accéder au Dashboard/i })).toBeVisible()
  await page.getByRole('button', { name: /Accéder au Dashboard/i }).click()
  await expect(page).toHaveURL(/\/dashboard/)

  if (errors.length) {
    throw new Error(`Console/page errors:\n${errors.join('\n')}`)
  }
})
