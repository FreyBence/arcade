let accessToken: string | null = null

export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function createAuthenticatedFetch(fetcher: typeof fetch = fetch): typeof fetch {
  return (input, init = {}) => {
    const token = getAccessToken()
    const headers = new Headers(init.headers)
    if (token) headers.set('authorization', `Bearer ${token}`)
    return fetcher(input, { ...init, headers })
  }
}
