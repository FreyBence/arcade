export type PasswordChangeErrorCode = 'INVALID_PASSWORD_CHANGE' | 'INCORRECT_CURRENT_PASSWORD'

export class PasswordChangeError extends Error {
  constructor(public readonly code: PasswordChangeErrorCode, message: string) {
    super(message)
    this.name = 'PasswordChangeError'
  }
}
