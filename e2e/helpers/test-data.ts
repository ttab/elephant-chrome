import { randomUUID } from 'node:crypto'

/** Prefix for all E2E test-created content, used for identification and cleanup. */
export const E2E_PREFIX = '[E2E-TEST]'

/** Generate a unique test title with the E2E prefix. */
export function testTitle(label: string): string {
  const id = randomUUID().slice(0, 8)
  return `${E2E_PREFIX} ${label} ${id}`
}

/** Generate a unique test slugline with the E2E prefix. */
export function testSlugline(label: string): string {
  const id = randomUUID().slice(0, 8)
  return `${E2E_PREFIX} ${label} ${id}`
}
