import { test, expect } from '@playwright/test'

test.describe('mobile smoke', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('home page fits mobile viewport', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/(connexion)?$/, { timeout: 15_000 })

    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 1
    })
    expect(hasHorizontalOverflow).toBe(false)
  })

  test('mobile dashboard session renders', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      window.localStorage.setItem('fitpulse_e2e_bypass', 'true')
    })
    await page.goto('/dashboard?view=session&e2e=1')
    await expect(page.getByTestId('session-root')).toBeVisible({ timeout: 15_000 })
  })
})
