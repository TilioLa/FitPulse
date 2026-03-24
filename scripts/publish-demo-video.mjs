import fs from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const testResultsDir = path.join(root, 'test-results')
const outputDir = path.join(root, 'public', 'videos')
const outputFile = path.join(outputDir, 'fitpulse-presentation.webm')

async function listWebmFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await listWebmFiles(fullPath)))
      continue
    }
    if (entry.isFile() && fullPath.endsWith('.webm')) {
      const stats = await fs.stat(fullPath)
      files.push({ path: fullPath, mtimeMs: stats.mtimeMs })
    }
  }
  return files
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true })

  let candidates = []
  try {
    candidates = await listWebmFiles(testResultsDir)
  } catch {
    console.error('Aucun dossier test-results trouvé. Lance d’abord: npm run video:record')
    process.exit(1)
  }

  if (candidates.length === 0) {
    console.error('Aucune vidéo .webm trouvée. Lance d’abord: npm run video:record')
    process.exit(1)
  }

  candidates.sort((a, b) => b.mtimeMs - a.mtimeMs)
  const latest = candidates[0]
  await fs.copyFile(latest.path, outputFile)
  console.log(`Video publiée: ${path.relative(root, outputFile)}`)
  console.log(`Source: ${path.relative(root, latest.path)}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
