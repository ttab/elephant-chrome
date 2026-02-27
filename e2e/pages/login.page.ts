import type { Page } from '@playwright/test'

export class LoginPage {
  constructor(private page: Page) {}

  get loginButton() {
    return this.page.getByRole('button', { name: /logga in/i })
  }

  async goto() {
    await this.page.goto('login')
  }

  async login(username: string, password: string) {
    await this.goto()
    await this.loginButton.click()

    // Fill Keycloak form
    await this.page.getByLabel(/username/i).fill(username)
    await this.page.locator('#password').fill(password)
    await this.page.getByRole('button', { name: /sign in|log in|logga in/i }).click()
  }

  async expectLoggedIn() {
    await this.page.waitForURL('**/elephant/**')
  }

  async expectLoginPage() {
    await this.loginButton.waitFor({ state: 'visible' })
  }
}
