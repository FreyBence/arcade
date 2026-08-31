import 'dotenv/config'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, resolve, sep } from 'node:path'
import { createConfiguredApplication } from './configuredApplication'
import { sendWebResponse, toWebRequest } from './nodeHttpAdapter'

const MIME_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
}

const environment = process.env
const application = createConfiguredApplication(environment)
const distributionDirectory = resolve(process.cwd(), 'dist')
const port = Number(environment.PORT ?? 4173)
if (!Number.isInteger(port) || port <= 0 || port > 65_535) throw new Error('PORT must be a valid TCP port.')

const server = createServer((request, response) => {
  void handleRequest(request, response)
})

async function handleRequest(request: Parameters<typeof toWebRequest>[0], response: Parameters<typeof sendWebResponse>[1]) {
  try {
    const webRequest = await toWebRequest(request)
    if (new URL(webRequest.url).pathname.startsWith('/api/')) {
      await sendWebResponse(await application.routeApiRequest(webRequest), response)
      return
    }

    const pathname = decodeURIComponent(new URL(webRequest.url).pathname)
    const requestedPath = resolve(distributionDirectory, `.${pathname}`)
    const assetPath = requestedPath.startsWith(`${distributionDirectory}${sep}`) && existsSync(requestedPath) && statSync(requestedPath).isFile()
      ? requestedPath
      : resolve(distributionDirectory, 'index.html')
    response.statusCode = 200
    response.setHeader('content-type', MIME_TYPES[extname(assetPath)] ?? 'application/octet-stream')
    createReadStream(assetPath).pipe(response)
  } catch {
    await sendWebResponse(Response.json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected server error occurred.' } }, { status: 500 }), response)
  }
}

async function shutdown() {
  await new Promise<void>((resolveShutdown, rejectShutdown) => {
    server.close((error) => error ? rejectShutdown(error) : resolveShutdown())
  })
  await application.close()
}

process.once('SIGINT', () => void shutdown())
process.once('SIGTERM', () => void shutdown())
server.listen(port, () => console.log(`Mobile Arcade listening on http://localhost:${port}`))
