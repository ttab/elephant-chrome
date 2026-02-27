import { test, expect } from '../../fixtures'
import { unauthenticatedTest } from '../../fixtures/auth.fixture'
import { LoginPage } from '../../pages/login.page'
import { waitForAppReady } from '../../helpers/wait'

test.describe('Authentication @critical', () => {
  test('authenticated user can access the app', async ({ page }) => {
    await page.goto('./')
    await waitForAppReady(page)
    await expect(page.locator('header').first()).toBeVisible()
  })

  test('session persists after page reload', async ({ page }) => {
    await page.goto('./')
    await waitForAppReady(page)

    await page.reload()
    await waitForAppReady(page)

    // Still authenticated — header is visible, no redirect to login
    await expect(page.locator('header').first()).toBeVisible()
  })
})

unauthenticatedTest.describe('Login flow @critical', () => {
  unauthenticatedTest(
    'unauthenticated user sees the login page',
    async ({ page }) => {
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.expectLoginPage()
    }
  )

  unauthenticatedTest(
    'login with Keycloak credentials',
    async ({ page }) => {
      const loginPage = new LoginPage(page)
      await loginPage.login(
        process.env.E2E_USERNAME!,
        process.env.E2E_PASSWORD!
      )
      await loginPage.expectLoggedIn()

      // App loads with header visible
      await expect(page.locator('header').first()).toBeVisible()
    }
  )
})
