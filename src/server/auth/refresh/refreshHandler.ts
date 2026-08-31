import { jsonResponse } from '../utils'
import type { RefreshConfig } from './refreshConfig'
import { readRefreshCookie } from './refreshCookie'
import { InvalidRefreshSessionError } from './refreshErrors'

interface RefreshService {
  refresh(refreshToken: string): Promise<string>
}

export function createRefreshHandler(config: RefreshConfig, refreshService: RefreshService) {
  return async function handleRefresh(request: Request): Promise<Response> {
    const refreshToken = readRefreshCookie(request.headers.get('cookie'), config.cookieName)
    if (!refreshToken) {
      return jsonResponse({ error: { code: 'INVALID_REFRESH_SESSION', message: 'Refresh session is invalid or expired.' } }, 401)
    }

    try {
      return jsonResponse({ accessToken: await refreshService.refresh(refreshToken) }, 200)
    } catch (error) {
      if (error instanceof InvalidRefreshSessionError) {
        return jsonResponse({ error: { code: 'INVALID_REFRESH_SESSION', message: error.message } }, 401)
      }
      throw error
    }
  }
}
