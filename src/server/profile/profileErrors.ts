export type ProfileErrorCode = 'INVALID_PROFILE' | 'DUPLICATE_EMAIL'

export class ProfileError extends Error {
  constructor(public readonly code: ProfileErrorCode, message: string) {
    super(message)
    this.name = 'ProfileError'
  }
}
