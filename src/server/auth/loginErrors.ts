export type LoginErrorCode = 'INVALID_CREDENTIALS' | 'INVALID_REQUEST'

export class LoginError extends Error {
  constructor(
    public readonly code: LoginErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'LoginError'
  }
}

export function invalidCredentials(): LoginError {
  return new LoginError('INVALID_CREDENTIALS', 'Email or password is incorrect.')
}
