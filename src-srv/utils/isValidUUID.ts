export function isValidUUID(uuid: string): boolean {
  // https://github.com/uuidjs/uuid/blob/main/src/regex.js
  const UUIDRegEx = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i
  return UUIDRegEx.test(uuid)
}
