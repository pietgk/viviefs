import { createServer, type IncomingMessage, type Server } from 'node:http'

export type CheckResult = {
  name: string
  status: 'PASS' | 'FAIL'
  detail: string
}

export type ProbeReport = {
  gate: string
  platform: 'ios' | 'android' | 'web'
  variant: string
  checks: CheckResult[]
  globals: Record<string, string>
}

export type ReportServer = {
  port: number
  url: string
  close: () => Promise<void>
  waitFor: (match: {
    gate: string
    platform: ProbeReport['platform']
    variant: string
  }) => Promise<ProbeReport>
}

const readBody = (request: IncomingMessage): Promise<string> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    request.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
    })
    request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    request.on('error', reject)
  })

export const startReportServer = async (
  host = '0.0.0.0',
): Promise<ReportServer> => {
  const pending = new Map<string, {
    resolve: (report: ProbeReport) => void
    reject: (error: Error) => void
  }>()
  const received = new Map<string, ProbeReport>()

  const keyOf = (report: {
    gate: string
    platform: string
    variant: string
  }) => `${report.gate}:${report.platform}:${report.variant}`

  const server: Server = createServer((request, response) => {
    if (request.method === 'GET' && request.url === '/health') {
      response.writeHead(200, { 'content-type': 'text/plain' })
      response.end('ok')
      return
    }
    if (request.method !== 'POST' || request.url !== '/report') {
      response.writeHead(404)
      response.end()
      return
    }
    void (async () => {
      try {
        const report = JSON.parse(await readBody(request)) as ProbeReport
        if (
          !report.gate ||
          !report.platform ||
          !report.variant ||
          !Array.isArray(report.checks)
        ) {
          response.writeHead(400)
          response.end('invalid report')
          return
        }
        const key = keyOf(report)
        received.set(key, report)
        pending.get(key)?.resolve(report)
        pending.delete(key)
        response.writeHead(200, { 'content-type': 'application/json' })
        response.end(JSON.stringify({ ok: true }))
      } catch (error) {
        response.writeHead(400)
        response.end(String(error))
      }
    })()
  })

  await new Promise<void>((resolve, reject) => {
    server.listen(0, host, () => resolve())
    server.on('error', reject)
  })
  const address = server.address()
  if (!address || typeof address === 'string') {
    throw new Error('report server did not bind a port')
  }

  return {
    port: address.port,
    url: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()))
      }),
    waitFor: (match) => {
      const key = keyOf(match)
      const existing = received.get(key)
      if (existing) return Promise.resolve(existing)
      return new Promise((resolve, reject) => {
        pending.set(key, { resolve, reject })
      })
    },
  }
}
