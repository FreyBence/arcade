import { describe, expect, it } from 'vitest'
import { isProfileImage } from './profileImage'

const cases = [
  { name: 'accepts no uploaded picture', input: null, expected: true },
  { name: 'accepts a supported image data URL', input: 'data:image/png;base64,aGVsbG8=', expected: true },
  { name: 'rejects SVG images', input: 'data:image/svg+xml;base64,PHN2Zz4=', expected: false },
  { name: 'rejects external URLs', input: 'https://example.com/avatar.png', expected: false },
]

describe('profile image validation', () => it.each(cases)('$name', ({ input, expected }) => expect(isProfileImage(input)).toBe(expected)))
