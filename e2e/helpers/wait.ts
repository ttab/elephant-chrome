import type { Page } from '@playwright/test'

/**
 * Wait for the app to finish loading after navigation.
 * Detects the main app shell being rendered (not the login page).
 */
export async function waitForAppReady(page: Page) {
  // The app renders a header when loaded and authenticated
  await page.locator('header').first().waitFor({
    state: 'visible',
    timeout: 15_000
  })
}

/**
 * Wait for network activity to settle (no pending requests).
 * @param timeout - Maximum time to wait in milliseconds (default: 5000).
 */
export async function waitForNetworkIdle(
  page: Page,
  timeout = 5_000
) {
  await page.waitForLoadState('networkidle', { timeout })
}
