export type RequestAuthenticationErrorCode = 'INVALID_ACCESS_TOKEN' | 'MISSING_ACCESS_TOKEN'

export class RequestAuthenticationError extends Error {
  constructor(public readonly code: RequestAuthenticationErrorCode) {
    super('Authentication is required.')
    this.name = 'RequestAuthenticationError'
  }
}
