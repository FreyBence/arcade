import type { IncomingMessage, ServerResponse } from 'node:http'

export async function toWebRequest(request: IncomingMessage): Promise<Request> {
  const host = request.headers.host ?? 'localhost'
  const url = new URL(request.url ?? '/', `http://${host}`)
  const headers = new Headers()
  for (const [name, value] of Object.entries(request.headers)) {
    if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(', ') : value)
  }

  const chunks: Buffer[] = []
  for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array))
  const body = chunks.length > 0 ? Buffer.concat(chunks) : undefined

  return new Request(url, { method: request.method, headers, body })
}

export async function sendWebResponse(response: Response, serverResponse: ServerResponse): Promise<void> {
  serverResponse.statusCode = response.status
  response.headers.forEach((value, name) => {
    if (name !== 'set-cookie') serverResponse.setHeader(name, value)
  })
  const cookies = response.headers.getSetCookie()
  if (cookies.length > 0) serverResponse.setHeader('set-cookie', cookies)
  serverResponse.end(Buffer.from(await response.arrayBuffer()))
}
