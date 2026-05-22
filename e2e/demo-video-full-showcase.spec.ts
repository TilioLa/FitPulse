import { expect, test } from '@playwright/test'

test.use({
  video: {
    mode: 'on',
    size: { width: 1920, height: 1080 },
  },
  viewport: { width: 1920, height: 1080 },
})

async function pause(page: any, ms: number) {
  await page.waitForTimeout(ms)
}

async function smoothScroll(page: any) {
  await page.mouse.wheel(0, 650)
  await pause(page, 900)
  await page.mouse.wheel(0, 650)
  await pause(page, 900)
  await page.mouse.wheel(0, -450)
  await pause(page, 700)
}

test('record full site showcase with E2E Test profile', async ({ page }) => {
  test.setTimeout(180_000)

  await page.goto('/')
  await expect(page.getByRole('heading', { name: /coach|régularité|séances efficaces/i })).toBeVisible()
  await pause(page, 1800)
  await smoothScroll(page)

  await page.goto('/inscription')
  await expect(page.getByRole('heading', { name: /créer un compte/i })).toBeVisible()
  await page.locator('#name').fill('E2E Test')
  await page.locator('#email').fill('e2e.test@example.com')
  await page.locator('#phone').fill('+33 6 00 00 00 00')
  await page.locator('#password').fill('Demo123!')
  await page.locator('#confirmPassword').fill('Demo123!')
  await pause(page, 800)
  await smoothScroll(page)

  await page.evaluate(() => {
    localStorage.setItem('fitpulse_e2e_bypass', 'true')
    localStorage.setItem(
      'fitpulse_settings',
      JSON.stringify({
        level: 'intermediaire',
        goals: ['Perte de poids', 'Cardio'],
        goal: 'Perte de poids',
        equipment: ['Poids du corps', 'Haltères'],
        sessionsPerWeek: 3,
        focusZones: ['Abdos', 'Bas du corps'],
        avoidZones: ['Genoux'],
      })
    )
  })

  await page.goto('/dashboard?view=feed&e2e=1')
  await expect(page).toHaveURL(/\/dashboard/)
  await pause(page, 1800)
  await smoothScroll(page)

  await page.goto('/dashboard?view=programs&e2e=1')
  await pause(page, 1400)
  await smoothScroll(page)

  await page.goto('/dashboard?view=session&e2e=1')
  await pause(page, 1400)
  await smoothScroll(page)

  await page.goto('/programmes')
  await expect(page.getByRole('heading', { name: /programmes/i })).toBeVisible()
  await pause(page, 1400)
  await smoothScroll(page)

  await page.goto('/exercices')
  await expect(page.getByRole('heading', { name: /exercices/i })).toBeVisible()
  await pause(page, 1500)
  await smoothScroll(page)

  await page.goto('/profil?view=history&e2e=1')
  await pause(page, 1400)
  await smoothScroll(page)

  await page.goto('/settings?e2e=1')
  await pause(page, 1500)
  await smoothScroll(page)

  await page.goto('/aide')
  await expect(page.getByRole('heading', { name: /aide|centre/i })).toBeVisible()
  await pause(page, 1400)

  await page.goto('/contact')
  await expect(page.getByRole('heading', { name: /contacter|contact/i })).toBeVisible()
  await pause(page, 2200)
})

