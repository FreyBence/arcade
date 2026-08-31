import { jsonResponse } from '../utils'
import type { RefreshConfig } from './refreshConfig'
import { readRefreshCookie, serializeClearedRefreshCookie } from './refreshCookie'

interface LogoutService {
  logout(refreshToken: string): Promise<void>
}

export function createLogoutHandler(config: RefreshConfig, logoutService: LogoutService) {
  return async function handleLogout(request: Request): Promise<Response> {
    const refreshToken = readRefreshCookie(request.headers.get('cookie'), config.cookieName)
    if (refreshToken) await logoutService.logout(refreshToken)

    const response = jsonResponse({ identity: 'guest' }, 200)
    response.headers.set('set-cookie', serializeClearedRefreshCookie(config))
    return response
  }
}
