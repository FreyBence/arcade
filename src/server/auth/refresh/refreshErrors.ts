export class InvalidRefreshSessionError extends Error {
  constructor() {
    super('Refresh session is invalid or expired.')
    this.name = 'InvalidRefreshSessionError'
  }
}
