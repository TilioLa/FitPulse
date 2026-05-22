import { chromium } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'

const baseUrl = process.env.DEMO_BASE_URL || 'https://fit-pulse-sandy.vercel.app'
const outDir = path.join(process.cwd(), 'public', 'videos')
const outName = `fitpulse-showcase-${Date.now()}`

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function smoothScroll(page) {
  await page.mouse.wheel(0, 650)
  await sleep(900)
  await page.mouse.wheel(0, 650)
  await sleep(900)
  await page.mouse.wheel(0, -450)
  await sleep(700)
}

async function main() {
  await fs.mkdir(outDir, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: { dir: outDir, size: { width: 1920, height: 1080 } },
  })
  const page = await context.newPage()

  await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' })
  if (page.url().includes('vercel.com/login') || page.url().includes('/sso-api')) {
    throw new Error(
      `Le domaine ${baseUrl} est protégé par Vercel SSO. Utilise une URL publique via DEMO_BASE_URL (ex: https://fit-pulse-sandy.vercel.app).`
    )
  }
  await sleep(1800)
  await smoothScroll(page)

  await page.goto(`${baseUrl}/inscription`, { waitUntil: 'domcontentloaded' })
  if (page.url().includes('vercel.com/login') || page.url().includes('/sso-api')) {
    throw new Error(
      `La page inscription est protégée par Vercel SSO sur ${baseUrl}. Passe une URL publique dans DEMO_BASE_URL.`
    )
  }
  await page.locator('#name').fill('E2E Test')
  await page.locator('#email').fill('e2e.test@example.com')
  await page.locator('#phone').fill('+33 6 00 00 00 00')
  await page.locator('#password').fill('Demo123!')
  await page.locator('#confirmPassword').fill('Demo123!')
  await sleep(1000)
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
      })
    )
  })

  for (const url of [
    '/dashboard?view=feed&e2e=1',
    '/dashboard?view=programs&e2e=1',
    '/dashboard?view=session&e2e=1',
    '/programmes',
    '/exercices',
    '/profil?view=history&e2e=1',
    '/settings?e2e=1',
    '/aide',
    '/contact',
  ]) {
    await page.goto(`${baseUrl}${url}`, { waitUntil: 'domcontentloaded' })
    await sleep(1500)
    await smoothScroll(page)
  }

  await sleep(1800)
  await context.close()
  await browser.close()

  const files = await fs.readdir(outDir)
  const latest = files
    .filter((f) => f.endsWith('.webm'))
    .sort((a, b) => (a < b ? 1 : -1))[0]

  if (!latest) {
    throw new Error('Aucune vidéo générée.')
  }

  const src = path.join(outDir, latest)
  const target = path.join(outDir, `${outName}.webm`)
  await fs.rename(src, target)
  console.log(target)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
