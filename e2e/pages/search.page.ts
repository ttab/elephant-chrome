import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export class SearchPage {
  constructor(private page: Page) {}

  get searchInput() {
    return this.page.getByPlaceholder('Sök')
  }

  get results() {
    return this.page.locator('tbody tr')
  }

  // Actions
  async goto() {
    await this.page.goto('search')
    await this.searchInput.waitFor({ state: 'visible' })
  }

  async search(query: string) {
    await this.searchInput.click()
    await this.searchInput.fill(query)
    await this.page.keyboard.press('Enter')
    // Wait for either results or a "no results" message.
    // Avoid networkidle — WebSocket keeps connection alive.
    // Wait for search to complete: tbody tr appears for both
    // result rows and the "Inga resultat hittades" empty state row.
    await this.results.first()
      .waitFor({ state: 'visible', timeout: 15_000 })
  }

  async selectType(type: 'Planeringar' | 'Händelser' | 'Artiklar') {
    // The type selector is a button showing current type text
    const typeButton = this.page.getByRole('button', {
      name: /planeringar|händelser|artiklar/i
    })
    await typeButton.click()
    await this.page
      .getByRole('option', { name: new RegExp(type, 'i') })
      .click()
  }

  // Assertions
  async expectResults() {
    await expect(this.results.first()).toBeVisible({ timeout: 10_000 })
  }

  async expectNoResults() {
    await expect(
      this.page.getByText(/inga resultat/i).first()
    ).toBeVisible()
  }
}
