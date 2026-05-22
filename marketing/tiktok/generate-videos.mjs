import fs from 'fs/promises'
import path from 'path'
import { chromium } from 'playwright'

const root = 'marketing/tiktok'
const inDir = path.join(root, 'videos')
const outDir = path.join(root, 'renders')
await fs.mkdir(outDir, { recursive: true })

const videos = [
  ['video-01-regularite',25],
  ['video-02-avant-apres',22],
  ['video-03-erreur-debutant',20],
  ['video-04-maison-ou-salle',24],
  ['video-05-perte-de-poids',26],
  ['video-06-prise-de-masse',23],
  ['video-07-coach-visuel',20],
  ['video-08-3-raisons-abandon',28],
  ['video-09-defi-7-jours',21],
  ['video-10-temoignage',25],
]

function parseTimecode(tc){
  const [h,m,sms]=tc.split(':')
  const [s,ms]=sms.split(',')
  return Number(h)*3600+Number(m)*60+Number(s)+Number(ms)/1000
}

function parseSrt(srt){
  return srt
    .split(/\n\s*\n/g)
    .map(b=>b.trim())
    .filter(Boolean)
    .map(block=>{
      const lines = block.split('\n').map(l=>l.trim())
      const timeLine = lines[1]
      const [a,b] = timeLine.split(' --> ')
      return { start: parseTimecode(a), end: parseTimecode(b), text: lines.slice(2).join(' ') }
    })
}

function escapeHtml(str){
  return str.replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]))
}

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } })

for (const [slug, duration] of videos) {
  const srtPath = path.join(inDir, `${slug}.srt`)
  const srt = await fs.readFile(srtPath, 'utf8')
  const cues = parseSrt(srt)
  const dir = path.join(outDir, slug)
  await fs.mkdir(dir, { recursive: true })

  const concatLines = []

  for (let i = 0; i < cues.length; i++) {
    const cue = cues[i]
    const nextStart = i < cues.length - 1 ? cues[i + 1].start : duration
    const segDur = Math.max(0.8, (nextStart - cue.start))
    const imgName = `slide-${String(i + 1).padStart(2, '0')}.png`
    const imgPath = path.join(dir, imgName)

    const html = `<!doctype html><html><head><meta charset='utf-8'><style>
      html,body{margin:0;width:1080px;height:1920px;}
      body{display:flex;flex-direction:column;justify-content:space-between;background:linear-gradient(180deg,#0f172a 0%,#1e3a8a 65%,#7e22ce 100%);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#fff}
      .top{padding:34px 48px;text-align:center;font-weight:700;letter-spacing:.12em;color:#93c5fd;font-size:34px}
      .center{padding:0 72px;display:flex;align-items:center;justify-content:center;flex:1}
      .card{background:rgba(2,6,23,.5);backdrop-filter:blur(3px);border:1px solid rgba(255,255,255,.25);border-radius:28px;padding:48px 42px;box-shadow:0 20px 60px rgba(0,0,0,.35)}
      .text{font-size:68px;line-height:1.12;text-align:center;font-weight:800;text-wrap:balance}
      .bottom{padding:24px 42px 48px;text-align:center}
      .cta{display:inline-block;padding:18px 30px;border-radius:18px;background:#0ea5e9;color:white;font-weight:700;font-size:40px;letter-spacing:.01em}
    </style></head><body>
      <div class='top'>FITPULSE</div>
      <div class='center'><div class='card'><div class='text'>${escapeHtml(cue.text)}</div></div></div>
      <div class='bottom'><div class='cta'>Lien en bio</div></div>
    </body></html>`

    await page.setContent(html)
    await page.screenshot({ path: imgPath, type: 'png' })

    concatLines.push(`file '${imgName}'`)
    concatLines.push(`duration ${segDur.toFixed(3)}`)
  }

  const lastFile = `slide-${String(cues.length).padStart(2, '0')}.png`
  concatLines.push(`file '${lastFile}'`)

  await fs.writeFile(path.join(dir, 'concat.txt'), concatLines.join('\n') + '\n')
}

await browser.close()
console.log('Slides generated.')
