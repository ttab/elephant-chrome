import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export class FactboxesOverviewPage {
  constructor(private page: Page) {}

  get table() {
    return this.page.locator('table').first()
  }

  get rows() {
    return this.page.locator('tbody tr')
  }

  get searchInput() {
    return this.page.getByPlaceholder('Fritext')
  }

  // Actions
  async goto() {
    await this.page.goto('factboxes')
    await this.table.waitFor({ state: 'visible' })
  }

  async search(query: string) {
    await this.searchInput.click()
    await this.searchInput.fill(query)
    await this.page.keyboard.press('Enter')
  }

  async clickRow(index: number) {
    await this.rows.nth(index).click()
  }

  // Assertions
  async expectTableVisible() {
    await expect(this.table).toBeVisible()
  }

  async expectRowsLoaded() {
    await expect(this.rows.first()).toBeVisible({ timeout: 10_000 })
  }
}
