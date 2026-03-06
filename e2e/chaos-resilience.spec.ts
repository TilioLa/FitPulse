import { expect, test } from '@playwright/test'

test('dashboard session shows offline resilience banner', async ({ context, page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.setItem('fitpulse_e2e_bypass', 'true')
    localStorage.setItem('fitpulse_pending_sync_count', '1')
  })
  await page.goto('/dashboard?view=session&e2e=1')
  await context.setOffline(true)
  await expect(page.getByText(/Hors ligne: tes actions sont enregistrées localement/i)).toBeVisible({ timeout: 15_000 })
  await context.setOffline(false)
})

test('dashboard settings survives multi-tab storage contention', async ({ context }) => {
  const pageA = await context.newPage()
  const pageB = await context.newPage()

  await pageA.goto('/')
  await pageA.evaluate(() => localStorage.setItem('fitpulse_e2e_bypass', 'true'))

  await pageB.goto('/dashboard?view=settings&e2e=1')
  await pageA.goto('/dashboard?view=settings&e2e=1')

  const nameA = `tab-a-${Date.now()}`
  const nameB = `tab-b-${Date.now()}`
  const emailA = `tab-a-${Date.now()}@example.com`
  const emailB = `tab-b-${Date.now()}@example.com`

  await pageA.getByLabel('Nom complet').fill(nameA)
  await pageA.locator('#settings-email').fill(emailA)
  await pageA.getByRole('button', { name: /sauvegarder les paramètres/i }).click()

  await pageB.getByLabel('Nom complet').fill(nameB)
  await pageB.locator('#settings-email').fill(emailB)
  await pageB.getByRole('button', { name: /sauvegarder les paramètres/i }).click()

  await pageA.reload()
  await expect(pageA.getByRole('heading', { name: /paramètres/i })).toBeVisible({ timeout: 15_000 })

  const storedName = await pageA.evaluate(() => {
    const raw = localStorage.getItem('fitpulse_settings')
    if (!raw) return ''
    try {
      return (JSON.parse(raw) as { name?: string }).name ?? ''
    } catch {
      return ''
    }
  })
  expect([nameA, nameB]).toContain(storedName)

  await pageA.close()
  await pageB.close()
})

test('session draft survives abrupt reload', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('fitpulse_e2e_bypass', 'true')
  })
  await page.goto('/e2e/session')
  await expect(page.getByTestId('session-root')).toBeVisible({ timeout: 15_000 })

  await page.getByTestId('mark-next-set').click()
  await page.reload()

  await expect
    .poll(async () => {
      return page.evaluate(() => {
        const raw = localStorage.getItem('fitpulse_current_workout')
        if (!raw) return false
        const parsed = JSON.parse(raw)
        return Boolean(parsed?.draft?.savedAt)
      })
    })
    .toBeTruthy()
})
