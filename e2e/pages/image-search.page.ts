import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export class ImageSearchPage {
  constructor(private page: Page) {}

  get searchInput() {
    return this.page.getByPlaceholder('Sök')
  }

  get mediaTypeSelect() {
    return this.page.getByRole('combobox')
  }

  get resultGrid() {
    return this.page.locator('.grid')
  }

  get thumbnails() {
    return this.resultGrid.locator('img')
  }

  get previewDialog() {
    return this.page.getByRole('dialog')
  }

  // Actions
  async goto() {
    await this.page.goto('imagesearch')
    await this.searchInput.waitFor({ state: 'visible' })
  }

  async search(query: string) {
    await this.searchInput.click()
    await this.searchInput.fill(query)
    await this.page.keyboard.press('Enter')
  }

  async selectMediaType(type: 'Bild' | 'Grafik') {
    await this.mediaTypeSelect.click()
    await this.page
      .getByRole('option', { name: type })
      .click()
  }

  async clickThumbnail(index: number) {
    await this.thumbnails.nth(index).click()
  }

  async closePreview() {
    await this.previewDialog
      .locator('svg.lucide-x')
      .click()
  }

  // Assertions
  async expectSearchVisible() {
    await expect(this.searchInput).toBeVisible()
  }

  async expectResults() {
    await expect(
      this.thumbnails.first()
    ).toBeVisible({ timeout: 15_000 })
  }

  async expectPreviewOpen() {
    await expect(this.previewDialog).toBeVisible()
  }

  async expectPreviewClosed() {
    await expect(this.previewDialog).toBeHidden()
  }
}
