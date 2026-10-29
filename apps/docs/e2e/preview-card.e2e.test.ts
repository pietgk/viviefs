// A preview on every link in a page's text (D90', I97), in a browser on the
// built site: on How a pattern is delivered, the second "ADRs" is a link to
// the ADR list, and hovering or focusing it shows its card as a page. The
// sidebar and the table of contents stay plain, as navigation.
import { existsSync, readFileSync, statSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { chromium, type Browser, type Page } from 'playwright'
import { withBase, withoutBase } from '../src/lib/repo.ts'

const DIST = fileURLToPath(new URL('../dist/', import.meta.url))

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
}

/** The site as it is deployed: a static server over `dist/`, under the build's base path (D61''). */
const serve = (): Promise<Server> =>
  new Promise((resolve) => {
    const server = createServer((request, response) => {
      const path = normalize(withoutBase(decodeURIComponent((request.url ?? '/').split('?')[0] ?? '/')))
      let file = join(DIST, path)
      if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html')
      if (!file.startsWith(DIST) || !existsSync(file)) {
        response.writeHead(404).end()
        return
      }
      response.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(readFileSync(file))
    })
    server.listen(0, '127.0.0.1', () => resolve(server))
  })

/**
 * Installed Chrome first, as qualification's web probes launch it: Playwright
 * 1.55's own Chromium exits at start on macOS 26.
 */
const launch = async (): Promise<Browser> => {
  try {
    return await chromium.launch({ channel: 'chrome', headless: true })
  } catch {
    return chromium.launch({ headless: true })
  }
}

let server: Server | undefined
let browser: Browser | undefined
let page: Page
/** Every request the page made that the site could not answer. */
const missing: string[] = []

beforeAll(async () => {
  if (!existsSync(join(DIST, 'index.html'))) throw new Error('No built site: run `pnpm exec nx run docs:build` first.')
  server = await serve()
  browser = await launch()
  page = await browser.newPage()
  page.on('response', (response) => {
    if (response.status() >= 400) missing.push(`${response.status()} ${response.url()}`)
  })
  await page.goto(`http://127.0.0.1:${(server.address() as AddressInfo).port}${withBase('/')}`)
})

afterAll(async () => {
  await browser?.close()
  // A missing build fails before the server starts; its error should not wait on a close that never comes.
  const started = server
  if (started) await new Promise((resolve) => started.close(resolve))
})

const card = () => page.locator('#ref-card')

const ADR_LIST_CARD = ['Page', 'Architectural decision records', 'ADRs preserve why consequential choices were made.']

describe('How a pattern is delivered', () => {
  it('loads every script and style the page asks for, as the site is deployed', () => {
    expect(missing).toEqual([])
  })

  it('shows the second "ADRs" as a page when it is hovered', async () => {
    const links = page.locator('.sl-markdown-content a', { hasText: /^ADRs$/ })
    await expect.poll(() => links.count()).toBeGreaterThan(1)
    // Scrolling hides a card under the pointer, so each link is in view before it is hovered.
    const hover = async (index: number) => {
      await links.nth(index).scrollIntoViewIfNeeded()
      await page.waitForTimeout(100)
      await links.nth(index).hover()
    }
    await hover(0)
    await expect.poll(() => card().locator('.ref-card-kind').textContent()).toBe('Glossary')
    await hover(1)
    await expect.poll(() => card().isVisible()).toBe(true)
    await expect
      .poll(async () => [
        await card().locator('.ref-card-kind').textContent(),
        await card().locator('.ref-card-label').textContent(),
        await card().locator('.ref-card-summary').textContent(),
      ])
      .toEqual(ADR_LIST_CARD)
    await page.mouse.move(0, 0)
    await expect.poll(() => card().isVisible()).toBe(false)
  })

  it('shows the same card when the link is focused, even when focus scrolls it into view', async () => {
    const link = page.locator('.sl-markdown-content a', { hasText: /^ADRs$/ }).nth(1)
    await page.evaluate('window.scrollTo(0, 0)')
    await page.waitForTimeout(100)
    await link.focus()
    await page.waitForTimeout(300)
    await expect.poll(() => card().isVisible()).toBe(true)
    expect(await card().locator('.ref-card-label').textContent()).toBe(ADR_LIST_CARD[1])
    expect(await link.getAttribute('aria-describedby')).toBe('ref-card')
    await page.keyboard.press('Escape')
    await expect.poll(() => card().isVisible()).toBe(false)
  })

  it('keeps the sidebar and the table of contents plain', async () => {
    expect(await page.locator('nav.sidebar a').count()).toBeGreaterThan(0)
    expect(await page.locator('nav.sidebar a.ref-link, starlight-toc a.ref-link').count()).toBe(0)
  })
})
