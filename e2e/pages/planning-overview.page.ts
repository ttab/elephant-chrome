import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export class PlanningOverviewPage {
  constructor(private page: Page) {}

  get table() {
    return this.page.locator('table').first()
  }

  get rows() {
    return this.page.locator('tbody tr')
  }

  get filterButton() {
    return this.page.getByRole('combobox').first()
  }

  // Actions
  async goto() {
    await this.page.goto('plannings')
    await this.table.waitFor({ state: 'visible' })
  }

  async search(query: string) {
    await this.filterButton.click()
    await this.page.getByText('Fritext', { exact: true }).click()
    const input = this.page.getByPlaceholder('Fritext')
    await input.waitFor({ state: 'visible' })
    await input.fill(query)
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
