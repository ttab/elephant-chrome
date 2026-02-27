import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export class LatestPage {
  constructor(private page: Page) {}

  get articles() {
    return this.page.locator('div.cursor-pointer[class*="hover:bg-table"]')
  }

  get nonFlashArticles() {
    return this.articles.filter({ hasNot: this.page.getByText('TT-FLASH') })
  }

  // Actions
  async goto() {
    await this.page.goto('latest')
    await this.articles.first().waitFor({ state: 'visible', timeout: 15_000 })
  }

  async clickArticle(index: number) {
    await this.articles.nth(index).click()
  }

  // Assertions
  async expectArticlesVisible() {
    await expect(this.articles.first()).toBeVisible()
  }
}
