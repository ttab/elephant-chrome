import { chromium, type FullConfig, type Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

export const AUTH_DIR = path.resolve(import.meta.dirname, '.auth')
export const AUTH_FILE = path.join(AUTH_DIR, 'user.json')
export const AUTH_FILE_2 = path.join(AUTH_DIR, 'user2.json')
const AUTH_MAX_AGE_MS = 3600_000 // 1 hour

function isAuthFresh(filePath: string): boolean {
  try {
    const stats = fs.statSync(filePath, { throwIfNoEntry: false })
    if (!stats || Date.now() - stats.mtimeMs >= AUTH_MAX_AGE_MS) {
      return false
    }
    const content = fs.readFileSync(filePath, 'utf-8')
    const data: unknown = JSON.parse(content)
    if (typeof data !== 'object' || data === null) {
      return false
    }
    return Array.isArray((data as Record<string, unknown>).cookies)
      && Array.isArray((data as Record<string, unknown>).origins)
  } catch {
    return false
  }
}

async function authenticateUser(
  page: Page,
  baseURL: string,
  username: string,
  password: string,
  authFile: string
) {
  // Strip kc_idp_hint from the OIDC auth URL so Keycloak shows
  // its own login form instead of redirecting to Google SAML.
  await page.route(
    /\/protocol\/openid-connect\/auth/,
    async (route) => {
      const url = new URL(route.request().url())
      url.searchParams.delete('kc_idp_hint')
      await route.continue({ url: url.toString() })
    }
  )

  const loginResponse = await page.goto(`${baseURL}login`)
  if (!loginResponse || loginResponse.status() >= 400) {
    throw new Error(
      `Login page returned HTTP `
      + `${loginResponse?.status() ?? 'no response'}. `
      + 'Is the dev server running?'
    )
  }

  // Click the login button — route interception strips kc_idp_hint
  // so Keycloak shows its own form instead of redirecting to Google
  await page.getByRole('button', {
    name: /logga in/i
  }).click()

  // Wait for Keycloak login form
  await page.waitForURL(
    (url) => url.hostname.includes('login.stage'),
    { timeout: 15_000 }
  )

  // Fill Keycloak login form
  await page.getByLabel(/username/i).fill(username)
  await page.locator('#password').fill(password)
  await page.getByRole('button', {
    name: /sign in|log in|logga in/i
  }).click()

  // Check for Keycloak error before waiting for redirect
  const keycloakError = page.locator(
    '.kc-feedback-text, #kc-error-message, .alert-error, '
    + '#input-error, [id*="error"], [class*="error"]'
  )
  if (await keycloakError.first().isVisible({ timeout: 3_000 })) {
    const errorText = await keycloakError.first().textContent()
    throw new Error(
      `Keycloak authentication failed: ${errorText?.trim()}. `
      + `Check credentials for user '${username}' in .env.e2e.`
    )
  }

  // Wait for redirect back to the app after authentication
  await page.waitForURL(`${baseURL}**`, { timeout: 15_000 })

  // Persist auth state
  await page.context().storageState({ path: authFile })
}

async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use.baseURL
  if (!baseURL) {
    throw new Error(
      'No baseURL configured in playwright.config.ts projects'
    )
  }

  fs.mkdirSync(AUTH_DIR, { recursive: true })

  const username = process.env.E2E_USERNAME
  const password = process.env.E2E_PASSWORD
  if (!username || !password) {
    throw new Error(
      'E2E_USERNAME and E2E_PASSWORD must be set in e2e/.env.e2e'
    )
  }

  const username2 = process.env.E2E_USERNAME_2
  const password2 = process.env.E2E_PASSWORD_2

  const needsUser1 = !isAuthFresh(AUTH_FILE)
  const needsUser2 = username2 && password2
    && !isAuthFresh(AUTH_FILE_2)

  if (!needsUser1 && !needsUser2) {
    return
  }

  const browser = await chromium.launch({
    executablePath:
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined
  })

  try {
    if (needsUser1) {
      const context = await browser.newContext()
      const page = await context.newPage()
      await authenticateUser(page, baseURL, username, password, AUTH_FILE)
      await context.close()
    }

    if (needsUser2) {
      const context = await browser.newContext()
      const page = await context.newPage()
      await authenticateUser(
        page, baseURL, username2, password2, AUTH_FILE_2
      )
      await context.close()
    }
  } finally {
    await browser.close()
  }
}

export default globalSetup
