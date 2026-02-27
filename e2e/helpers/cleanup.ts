import { E2E_PREFIX } from './test-data'

/**
 * Track document IDs created during a test for identification.
 * NOTE: cleanup() currently only logs a warning — automatic deletion
 * is pending a server-side delete API.
 */
export class CleanupTracker {
  private ids: string[] = []

  add(id: string) {
    this.ids.push(id)
  }

  getIds(): string[] {
    return [...this.ids]
  }

  cleanup() {
    // Documents tagged with E2E_PREFIX can be identified for manual cleanup.
    // Automatic deletion is not supported by the current API.
    // This is a placeholder for when a delete endpoint is available.
    if (this.ids.length > 0) {
      console.warn(
        `[E2E cleanup] ${this.ids.length} document(s) not deleted `
        + `(no API support): ${this.ids.join(', ')}`
      )
    }
    this.ids = []
  }
}

export { E2E_PREFIX }
