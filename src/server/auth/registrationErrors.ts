export type RegistrationErrorCode = 'DUPLICATE_EMAIL' | 'INVALID_REQUEST'

export class RegistrationError extends Error {
  constructor(
    public readonly code: RegistrationErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'RegistrationError'
  }
}

export class DuplicateEmailError extends RegistrationError {
  constructor() {
    super('DUPLICATE_EMAIL', 'An account with this email already exists.')
    this.name = 'DuplicateEmailError'
  }
}
