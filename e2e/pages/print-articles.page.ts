import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export class PrintArticlesPage {
  constructor(private page: Page) {}

  get table() {
    return this.page.locator('table').first()
  }

  get rows() {
    return this.page.locator('tbody tr')
  }

  // Actions
  async goto() {
    await this.page.goto('print')
    await this.table.waitFor({ state: 'visible' })
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
