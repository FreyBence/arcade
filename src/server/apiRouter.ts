import type { ApplicationApi } from './applicationApi'
import { jsonResponse } from './auth/utils'

interface RouteDefinition {
  method: 'GET' | 'POST'
  handler(request: Request): Promise<Response>
}

export function createApiRouter(api: ApplicationApi) {
  const routes = new Map<string, RouteDefinition>([
    ['/api/register', { method: 'POST', handler: api.register }],
    ['/api/login', { method: 'POST', handler: api.login }],
    ['/api/refresh', { method: 'POST', handler: api.refresh }],
    ['/api/logout', { method: 'POST', handler: api.logout }],
    ['/api/me', { method: 'GET', handler: api.identity }],
  ])

  return async function routeApiRequest(request: Request): Promise<Response> {
    const route = routes.get(new URL(request.url).pathname)
    if (!route) return jsonResponse({ error: { code: 'NOT_FOUND', message: 'API endpoint not found.' } }, 404)
    if (request.method !== route.method) {
      return new Response(JSON.stringify({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed.' } }), {
        status: 405,
        headers: { 'allow': route.method, 'content-type': 'application/json' },
      })
    }

    try {
      return await route.handler(request)
    } catch {
      return jsonResponse({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected server error occurred.' } }, 500)
    }
  }
}
