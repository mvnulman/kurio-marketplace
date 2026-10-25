/**
 * Auditoria Lighthouse das telas de Início e Detalhes do NFT.
 *
 * Executa o build de produção com mocks (cenário padrão), faz 3 medições por
 * página/perfil e reporta a mediana das categorias + LCP/CLS/TBT.
 *
 * Uso: pnpm lighthouse  (gera reports/lighthouse/*.html|json e summary.json)
 */
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

import * as chromeLauncher from 'chrome-launcher'
import lighthouse from 'lighthouse'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const reportDir = path.join(root, 'reports', 'lighthouse')
const PORT = 4173
const BASE_URL = `http://localhost:${PORT}`

const PAGES = [
  { id: 'inicio', url: '/' },
  { id: 'detalhe', url: '/nft/nft-01' },
]

const PROFILES = [
  {
    id: 'mobile',
    formFactor: 'mobile',
    screenEmulation: { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75, disabled: false },
    emulatedUserAgent: 'Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 Chrome-Lighthouse',
    throttling: { rttMs: 150, throughputKbps: 1_638.4, requestLatencyMs: 562.5, downloadThroughputKbps: 1_638.4, uploadThroughputKbps: 675, cpuSlowdownMultiplier: 4 },
  },
  {
    id: 'desktop',
    formFactor: 'desktop',
    screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false },
    emulatedUserAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Chrome-Lighthouse',
    throttling: { rttMs: 40, throughputKbps: 10_240, requestLatencyMs: 0, downloadThroughputKbps: 10_240, uploadThroughputKbps: 10_240, cpuSlowdownMultiplier: 1 },
  },
]

const RUNS = 3
const GOALS = { performance: 90, accessibility: 95, 'best-practices': 95, seo: 90 }

function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle]
}

async function waitForServer(url, timeoutMs = 30_000) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }
  throw new Error('Servidor de preview não respondeu a tempo.')
}

async function startPreview() {
  const child = spawn(process.execPath, [
    path.join(root, 'node_modules', 'vite', 'bin', 'vite.js'),
    'preview',
    '--port',
    String(PORT),
    '--strictPort',
  ], { cwd: root, stdio: 'ignore' })
  await waitForServer(`${BASE_URL}/`)
  return child
}

async function runOnce(page, profile, index) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new', '--no-sandbox'] })

  try {
    const result = await lighthouse(`${BASE_URL}${page.url}`, {
      port: chrome.port,
      output: 'html',
      logLevel: 'error',
      onlyCategories: Object.keys(GOALS),
      formFactor: profile.formFactor,
      screenEmulation: profile.screenEmulation,
      emulatedUserAgent: profile.emulatedUserAgent,
      throttling: profile.throttling,
    })

    const report = result.lhr
    const html = result.report

    const baseName = `${page.id}-${profile.id}-run${index + 1}`
    await writeFile(path.join(reportDir, `${baseName}.report.html`), html)
    await writeFile(path.join(reportDir, `${baseName}.report.json`), JSON.stringify(report, null, 2))

    const metrics = {
      lcp: report.audits['largest-contentful-paint']?.numericValue ?? null,
      cls: report.audits['cumulative-layout-shift']?.numericValue ?? null,
      tbt: report.audits['total-blocking-time']?.numericValue ?? null,
    }

    const scores = Object.fromEntries(
      Object.keys(GOALS).map((category) => [category, report.categories[category]?.score ?? 0]),
    )
    console.log(`[${baseName}] P=${scores.performance} A=${scores.accessibility} BP=${scores['best-practices']} SEO=${scores.seo}`)
    return { scores, metrics }
  } finally {
    await chrome.kill()
  }
}

async function main() {
  await mkdir(reportDir, { recursive: true })
  const server = await startPreview()

  try {
    const summary = {}

    for (const page of PAGES) {
      for (const profile of PROFILES) {
        const results = []
        for (let index = 0; index < RUNS; index += 1) {
          results.push(await runOnce(page, profile, index))
        }

        const key = `${page.id}-${profile.id}`
        const scores = Object.fromEntries(
          Object.keys(GOALS).map((category) => [
            category,
            median(results.map((result) => result.scores[category] * 100)),
          ]),
        )
        const metrics = Object.fromEntries(
          ['lcp', 'cls', 'tbt'].map((metric) => [
            metric,
            median(results.map((result) => result.metrics[metric] ?? 0)),
          ]),
        )

        summary[key] = { runs: RUNS, medianScores: scores, medianMetrics: metrics }

        const belowGoal = Object.entries(GOALS).filter(([category, goal]) => scores[category] < goal)
        if (belowGoal.length > 0) {
          console.warn(`[goal] ${key}: abaixo da meta -> ${belowGoal.map(([category, goal]) => `${category} (${scores[category]} < ${goal})`).join(', ')}`)
        }
      }
    }

    await writeFile(path.join(reportDir, 'summary.json'), JSON.stringify(summary, null, 2))
    console.log('\n== Mediana por página/perfil ==')
    console.log(JSON.stringify(summary, null, 2))
  } finally {
    server.kill()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
