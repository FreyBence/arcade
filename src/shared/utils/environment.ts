export function readPositiveInteger(environment: ImportMetaEnv, name: string, fallback: number): number {
  const value: unknown = environment[name]
  if (value === undefined || value === '') return fallback

  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer.`)
  }

  return parsed
}

export function readString(environment: ImportMetaEnv, name: string, fallback: string): string {
  const value: unknown = environment[name]
  return typeof value === 'string' && value !== '' ? value : fallback
}
