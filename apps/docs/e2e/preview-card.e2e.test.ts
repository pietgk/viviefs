// A preview on every link in a page's text (D90', I97), in a browser on the
// built site: on How a pattern is delivered, the second "ADRs" is a link to
// the ADR list, and hovering or focusing it shows its card as a page. The
// sidebar and the table of contents stay plain, as navigation. Lesson 1's
// widget, further down, is driven on the same built site.
import { existsSync, readFileSync, statSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { chromium, type Browser, type Page } from 'playwright'
import { docsBase, withBase, withoutBase } from '../src/lib/repo.ts'

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
      const requested = decodeURIComponent((request.url ?? '/').split('?')[0] ?? '/')
      const path = normalize(withoutBase(requested))
      // Under a base, the deployed site answers nothing outside it: a root-relative asset would 404 there.
      const outside = docsBase() !== '/' && path === normalize(requested)
      let file = join(DIST, path)
      if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html')
      if (outside || !file.startsWith(DIST) || !existsSync(file)) {
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

  it('has the tab icon it links, which a headless browser does not ask for by itself', async () => {
    const href = await page.locator('link[rel~="icon"]').first().getAttribute('href')
    const response = await page.request.get(new URL(href ?? '', page.url()).href)
    expect([href, response.status()]).toEqual([withBase('/favicon.svg'), 200])
    expect(response.headers()['content-type']).toBe('image/svg+xml')
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

// Lesson 1's widget (D216, D217, D219), on the same built site: device A
// creates a list and syncs, so the server holds it and A gets the commit back;
// B pulls it and renames; sending the same changeset again stores nothing, and
// the same rename with new tags is stored twice. A word card points into the
// widget, and the line for the step shows each append. Lessons 2-4's widgets
// and every lesson's exercise review (D222) are driven after it.
let lesson: Page
const lessonProblems: string[] = []

beforeAll(async () => {
  lesson = await (browser as Browser).newPage({ viewport: { width: 1280, height: 900 } })
  lesson.on('pageerror', (error) => lessonProblems.push(error.message))
  lesson.on('console', (message) => {
    if (message.type() === 'error') lessonProblems.push(message.text())
  })
  await lesson.goto(`http://127.0.0.1:${(server?.address() as AddressInfo).port}${withBase('/guides/log-store/lessons/01-a-datom-is-one-fact/')}`)
})

const widget = () => lesson.locator('[data-datom-log]')
const press = (action: string) => widget().locator(`[data-act="${action}"]`).click()
const counted = async () => [await widget().locator('[data-count-inserted] b').textContent(), await widget().locator('[data-count-duplicates] b').textContent()]
const rowsOn = (node: 'A' | 'B' | 'server') => widget().locator(`[data-node="${node}"] .vv-row`)
const enabled = (action: string) => widget().locator(`[data-act="${action}"]`).isEnabled()

describe('lesson 1', () => {
  it('starts with three empty logs and only creating the list to press', async () => {
    expect(await widget().locator('[data-node]').count()).toBe(3)
    expect(await rowsOn('server').count()).toBe(0)
    expect(await enabled('create A')).toBe(true)
    expect(await enabled('rename A')).toBe(false)
    expect(await enabled('sync A')).toBe(false)
    expect(await enabled('sendAgain')).toBe(false)
  })

  it('creates the list on A, then syncs it to the server, and A gets the commit back', async () => {
    await press('create A')
    expect(await rowsOn('A').count()).toBe(2)
    expect(await rowsOn('server').count()).toBe(0)
    expect(await enabled('create B')).toBe(false)
    expect(await enabled('rename B')).toBe(false)
    expect(await widget().locator('[data-node="A"] .vv-psub').textContent()).toMatch(/outbox: 1 waiting/)
    expect(await widget().locator('[data-part="a"] .vv-val').textContent()).toBe('evidence/list/title')
    await press('sync A')
    expect(await rowsOn('server').count()).toBe(3)
    expect(await rowsOn('A').count()).toBe(3)
    expect(await counted()).toEqual(['3', '0'])
    expect(await widget().locator('[data-count-where]').textContent()).toBe('on the server')
  })

  it('lets B pull the list and rename it with one fact, and stores nothing when it is sent again', async () => {
    await press('sync B')
    expect(await rowsOn('B').count()).toBe(3)
    await press('rename B')
    expect(await rowsOn('B').count()).toBe(4)
    await press('sync B')
    expect(await rowsOn('server').count()).toBe(5)
    expect(await widget().locator('[data-node="server"] .vv-row', { hasText: 'list' }).count()).toBe(1)
    await press('sendAgain')
    expect(await rowsOn('server').count()).toBe(5)
    expect(await counted()).toEqual(['0', '2'])
  })

  it('stores the same rename a second time when it gets new tags', async () => {
    await press('newTags')
    expect(await rowsOn('server').count()).toBe(7)
    expect(await counted()).toEqual(['2', '0'])
    expect(await widget().locator('[data-node="server"] .vv-is-twice').count()).toBe(2)
    expect(await widget().locator('[data-node="B"] .vv-is-twice').count()).toBe(2)
  })

  it('writes the last step as uses of append, on each log', async () => {
    const lines = lesson.locator('[data-datom-log-step] div')
    expect(await lines.count()).toBe(5)
    expect(await lines.first().textContent()).toMatch(/^append\(log on B of 5, datom \w{4}\) => \(log on B of 6, inserted\)$/)
    expect(await lines.nth(1).textContent()).toMatch(/^append\(server log of 5, datom \w{4}\) => \(server log of 6, inserted\)$/)
  })

  it('points at the entity and at the server from their word cards', async () => {
    await lesson.locator('#term-entity [data-point-at="entity"]').click()
    expect(await widget().getAttribute('data-point')).toBe('entity')
    const outline = await widget().locator('[data-part="e"]').evaluate('(element) => getComputedStyle(element).boxShadow')
    expect(outline).not.toBe('none')
    await lesson.locator('#term-server [data-point-at="server"]').click()
    expect(await widget().getAttribute('data-point')).toBe('server')
    const opacity = await lesson.evaluate("[...document.querySelectorAll('[data-datom-log] .vv-p-server')].map((element) => getComputedStyle(element).opacity)")
    expect(opacity).toEqual(['1', '1'])
  })

  it('shows a row it is asked about, with its position in every log, and starts over', async () => {
    await rowsOn('A').first().click()
    expect(await widget().locator('[data-part="a"] .vv-val').textContent()).toBe('evidence/list')
    expect(await widget().locator('.vv-pos').textContent()).toMatch(/^Its position: 1 on device A, 1 on the server, 1 on device B\./)
    await press('reset')
    expect(await rowsOn('server').count()).toBe(0)
    expect(await counted()).toEqual(['-', '-'])
  })

  it('gives one fact other positions in other logs', async () => {
    for (const action of ['create A', 'sync A', 'sync B', 'rename B', 'rename A', 'sync A', 'sync B']) await press(action)
    await widget().locator('[data-node="B"] .vv-row').nth(3).click()
    expect(await widget().locator('.vv-pos').textContent()).toMatch(/^Its position: not on device A yet, 6 on the server, 4 on device B\./)
    await press('reset')
  })

  it('reads every word card from the glossary', async () => {
    const cards = lesson.locator('.vv-term')
    expect(await cards.count()).toBe(12)
    expect(await lesson.locator('#term-tx .vv-term-hover').textContent()).toBe('The tag a fact gets once, when it is built, and keeps on every copy of the log.')
  })

  it('shows the exercise as a review: the problem, both runs and the change', async () => {
    const runs = lesson.locator('.vv-exercise .expressive-code')
    expect(await runs.count()).toBe(4)
    const text = await lesson.locator('.vv-exercise').textContent()
    expect(text).toContain('01.01 append and stream: not yet')
    expect(text).toContain('What the test saw')
    expect(text).toContain('01.01 append and stream: done')
    expect(await lesson.locator('.vv-exercise .ins').count()).toBeGreaterThan(0)
  })

  it('runs without an error', () => {
    expect(lessonProblems).toEqual([])
  })
})

const openLesson = async (slug: string) => {
  const page = await (browser as Browser).newPage({ viewport: { width: 1280, height: 900 } })
  const problems: string[] = []
  page.on('pageerror', (error) => problems.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(message.text())
  })
  await page.goto(`http://127.0.0.1:${(server?.address() as AddressInfo).port}${withBase(`/guides/log-store/lessons/${slug}/`)}`)
  return { page, problems }
}

describe('lessons 2 to 4', () => {
  it('lesson 2: a running clock ignores the wall clock, and a tag from ahead pulls it up', async () => {
    const { page, problems } = await openLesson('02-time-without-a-trusted-clock')
    const clock = page.locator('[data-clock]')
    const act = (action: string) => clock.locator(`[data-act="${action}"]`).click()
    for (const action of ['mint A', 'jumpBack', 'wait', 'mint A', 'ahead', 'mint B', 'receive', 'mint A']) await act(action)
    const rows = await clock.locator('[data-device="A"] .vv-w-row').allTextContents()
    expect(rows.map((row) => row.replace(/\s+/g, ' ').trim())).toEqual(['A1(+0, 0)minted', 'A2(+1, 0)minted', 'B1(+3001, 0)received from B', 'A3(+3001, 1)minted'])
    expect(await clock.locator('[data-order] .vv-w-chip').allTextContents()).toEqual(['A1 (+0, 0)', 'A2 (+1, 0)', 'B1 (+3001, 0)', 'A3 (+3001, 1)'])
    expect(await page.locator('.vv-exercise').count()).toBe(2)
    expect(problems).toEqual([])
    await page.close()
  })

  it('lesson 3: each reader keeps its own place, and acknowledging before sending loses facts', async () => {
    const { page, problems } = await openLesson('03-each-reader-keeps-its-place')
    const box = page.locator('[data-readers]')
    const act = (action: string) => box.locator(`[data-act="${action}"]`).click()
    expect(await box.locator('[data-act="export"]').isDisabled()).toBe(true)
    await act('write')
    await act('project')
    await act('write')
    expect(await box.locator('[data-act="write"]').textContent()).toBe('Rename it')
    expect(await box.locator('[data-models-title]').textContent()).toBe('Visit')
    await act('crashAfterSend')
    await act('export')
    expect(await box.locator('[data-text]').textContent()).toMatch(/5 of them motel already had/)
    await act('write')
    await act('ackThenCrash')
    expect(await box.locator('[data-log] .vv-w-lost').count()).toBe(2)
    expect(await box.locator('[data-log] tr').count()).toBe(7)
    expect(await box.locator('[data-export-received]').textContent()).toBe('5 of 7 facts, 2 never')
    expect(problems).toEqual([])
    await page.close()
  })

  it('lesson 4: a store needs its pieces, and in memory it fails only hlc reboot', async () => {
    const { page, problems } = await openLesson('04-one-contract-many-stores')
    const box = page.locator('[data-stores]')
    expect(await box.locator('[data-run]').isDisabled()).toBe(true)
    // A choice is a form control, a button an action (the convention in widget.css).
    expect(await box.locator('button[aria-pressed]').count()).toBe(0)
    await box.locator('[data-piece="entropy"]').check()
    await box.locator('[data-piece="device"]').check()
    await box.locator('[data-run]').click()
    expect(await box.locator('[data-results] .vv-w-bad').allTextContents()).toEqual(['FAILhlc reboot'])
    await box.locator('[data-database]').selectOption('sqlite-file')
    await box.locator('[data-run]').click()
    expect(await box.locator('[data-results] .vv-w-bad').count()).toBe(0)
    expect(problems).toEqual([])
    await page.close()
  })
})
