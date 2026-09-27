/**
 * verify quality / bundle-size. Gates each platform's shipped Hermes bundle
 * on the budget in `<app>/bundle-budget.json` and reports why it changed:
 * size against the recorded reference, and the packages whose share of the
 * minified JS grew or shrank most.
 *
 * Inputs, exported by the app's `build` and `bundle-size` targets:
 *   .artifacts/verify/<app>/<platform>/**\/*.hbc          (shipped bundle)
 *   .artifacts/verify/<app>/<platform>-js/**\/*.js(.map)  (for attribution)
 *
 * Usage: node --experimental-strip-types tools/verify/src/bundle-size.ts <app>
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { bytesPerPackage, bytesPerSource, type SourceMap } from './bundle-report.ts'

type Reference = {
  readonly label: string
  readonly commit: string
  readonly recordedAt: string
  readonly hbcBytes: number
  readonly jsBytes: number | null
  readonly packages: Readonly<Record<string, number>>
}

type Budget = {
  readonly budgetBytes: number
  readonly references: Readonly<Record<string, Reference>>
}

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

const findFile = (directory: string, suffix: string): string | undefined => {
  let entries: string[]
  try {
    entries = readdirSync(directory)
  } catch {
    return undefined
  }
  for (const entry of entries) {
    const path = join(directory, entry)
    if (statSync(path).isDirectory()) {
      const found = findFile(path, suffix)
      if (found) return found
    } else if (entry.endsWith(suffix)) {
      return path
    }
  }
  return undefined
}

const mb = (bytes: number) => `${(bytes / 1_000_000).toFixed(2)} MB`
const signed = (bytes: number) => `${bytes >= 0 ? '+' : ''}${(bytes / 1000).toFixed(1)} KB`
const percent = (part: number, whole: number) =>
  whole === 0 ? 'n/a' : `${part >= 0 ? '+' : ''}${((part / whole) * 100).toFixed(0)}%`

export type PlatformReport = {
  readonly platform: string
  readonly hbcBytes: number
  readonly budgetBytes: number
  readonly overBudget: boolean
  readonly reference: { readonly label: string; readonly hbcBytes: number; readonly delta: number }
  readonly jsBytes: number | null
  readonly topPackages: ReadonlyArray<{ readonly name: string; readonly bytes: number }>
  readonly changes: ReadonlyArray<{ readonly name: string; readonly from: number; readonly to: number }>
}

export const reportPlatform = (
  platform: string,
  hbcBytes: number,
  js: { readonly code: string; readonly map: SourceMap } | undefined,
  budget: Budget,
): PlatformReport => {
  const reference = budget.references[platform]
  const shares = js ? bytesPerPackage(bytesPerSource(js.code, js.map)) : []
  const now = new Map(shares.map((share) => [share.name, share.bytes]))
  const before = new Map(Object.entries(reference?.packages ?? {}))
  const changes = [...new Set([...now.keys(), ...before.keys()])]
    .map((name) => ({ name, from: before.get(name) ?? 0, to: now.get(name) ?? 0 }))
    .filter((change) => Math.abs(change.to - change.from) >= 1000 && before.size > 0)
    .sort((left, right) => Math.abs(right.to - right.from) - Math.abs(left.to - left.from))
    .slice(0, 12)
  return {
    platform,
    hbcBytes,
    budgetBytes: budget.budgetBytes,
    overBudget: hbcBytes > budget.budgetBytes,
    reference: {
      label: reference ? `${reference.label} (${reference.commit}, ${reference.recordedAt})` : 'none recorded',
      hbcBytes: reference?.hbcBytes ?? 0,
      delta: hbcBytes - (reference?.hbcBytes ?? 0),
    },
    jsBytes: js ? Buffer.byteLength(js.code) : null,
    topPackages: shares.slice(0, 8),
    changes,
  }
}

export const formatReport = (report: PlatformReport): string => {
  const lines = [
    `${report.platform}: ${mb(report.hbcBytes)} Hermes bundle, budget ${mb(report.budgetBytes)}, ` +
      `headroom ${mb(report.budgetBytes - report.hbcBytes)}${report.overBudget ? '  OVER BUDGET' : ''}`,
    `  vs ${report.reference.label}: ${mb(report.reference.hbcBytes)} -> ${mb(report.hbcBytes)} ` +
      `(${signed(report.reference.delta)}, ${percent(report.reference.delta, report.reference.hbcBytes)})`,
  ]
  if (report.jsBytes !== null) {
    lines.push(`  largest shares of ${mb(report.jsBytes)} minified JS:`)
    for (const share of report.topPackages) {
      lines.push(`    ${share.name.padEnd(40)} ${mb(share.bytes).padStart(9)}`)
    }
  }
  if (report.changes.length > 0) {
    lines.push('  changed since the reference (minified JS):')
    for (const change of report.changes) {
      lines.push(
        `    ${change.name.padEnd(40)} ${signed(change.to - change.from).padStart(10)}` +
          (change.from === 0 ? '  (new)' : change.to === 0 ? '  (gone)' : ''),
      )
    }
  }
  return lines.join('\n')
}

const main = () => {
  const app = process.argv[2]
  if (!app) throw new Error('usage: bundle-size.ts <app directory, e.g. apps/evidence-mobile>')
  const budget = JSON.parse(readFileSync(join(ROOT, app, 'bundle-budget.json'), 'utf8')) as Budget
  const name = app.split('/').at(-1) ?? app
  const out = join(ROOT, '.artifacts/verify', name)
  const reports: PlatformReport[] = []
  for (const platform of ['ios', 'android']) {
    const hbc = findFile(join(out, platform), '.hbc')
    if (!hbc) throw new Error(`no ${platform} Hermes bundle under ${join(out, platform)}; run the build target first`)
    const jsFile = findFile(join(out, `${platform}-js`), '.js')
    const js = jsFile
      ? {
          code: readFileSync(jsFile, 'utf8'),
          map: JSON.parse(readFileSync(`${jsFile}.map`, 'utf8')) as SourceMap,
        }
      : undefined
    const report = reportPlatform(platform, statSync(hbc).size, js, budget)
    reports.push(report)
    console.log(formatReport(report))
  }
  writeFileSync(join(out, 'bundle-report.json'), `${JSON.stringify(reports, null, 2)}\n`)
  const over = reports.filter((report) => report.overBudget)
  if (over.length > 0) {
    console.error(`bundle over budget: ${over.map((report) => report.platform).join(', ')}`)
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main()
