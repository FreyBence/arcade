export function hasOnlyAllowedFields(input: Record<string, unknown>, allowedFields: readonly string[]): boolean {
  return Object.keys(input).every((field) => allowedFields.includes(field))
}
