import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export class ApprovalsPage {
  constructor(private page: Page) {}

  get columns() {
    return this.page.locator('div.col-span-1')
  }

  get cards() {
    return this.page.locator('div[tabindex="0"].rounded')
  }

  // Actions
  async goto() {
    await this.page.goto('approvals')
    // Wait for grid to render (card-based layout, no <main>)
    await this.page.locator('header').first().waitFor({ state: 'visible' })
  }

  async navigateRight() {
    await this.page.keyboard.press('ArrowRight')
  }

  async navigateLeft() {
    await this.page.keyboard.press('ArrowLeft')
  }

  async navigateDown() {
    await this.page.keyboard.press('ArrowDown')
  }

  async navigateUp() {
    await this.page.keyboard.press('ArrowUp')
  }

  async openFocusedCard() {
    await this.page.keyboard.press('Enter')
  }

  async previewFocusedCard() {
    await this.page.keyboard.press('Space')
  }

  // Assertions
  async expectGridVisible() {
    await expect(this.columns.first()).toBeVisible()
  }
}
