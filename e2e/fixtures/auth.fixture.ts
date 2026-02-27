import type { Page } from '@playwright/test'
import { test as base, errors } from '@playwright/test'
import path from 'node:path'

const AUTH_FILE = path.resolve(import.meta.dirname, '../.auth/user.json')

/**
 * Unauthenticated test fixture — does NOT load saved auth state.
 * Use for login/logout tests that need a fresh session.
 */
export const unauthenticatedTest = base.extend({
  storageState: { cookies: [], origins: [] }
})

/**
 * Force a re-authentication by navigating through the login flow.
 * Persists the new auth state to the storage file.
 * Currently unused — intended for tests that encounter expired sessions.
 */
export async function reauthenticate(page: Page) {
  const currentUrl = page.url()
  const match = currentUrl.match(/^(https?:\/\/[^/]+\/[^/]+)/)

  if (!match) {
    throw new Error(
      'Cannot determine app base URL from current page URL: '
      + `'${currentUrl}'. reauthenticate() must be called from within the app.`
    )
  }

  const appBase = match[1]

  await page.goto(`${appBase}/login`)
  await page.getByRole('button', { name: /logga in/i }).click()

  // If the Keycloak session cookie is still valid, this will auto-complete.
  // Otherwise, the login form will need valid credentials.
  await page.waitForURL(`${appBase}/**`, { timeout: 30_000 })

  const header = page.locator('header')
  let headerVisible = false
  try {
    headerVisible = await header.isVisible({ timeout: 5_000 })
  } catch (error) {
    if (!(error instanceof errors.TimeoutError)) {
      throw error
    }
  }

  if (!headerVisible) {
    throw new Error(
      'Re-authentication appeared to complete but the app did not load. '
      + 'The Keycloak session may have fully expired.'
    )
  }

  await page.context().storageState({ path: AUTH_FILE })
}
