import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export class PrintEditorPage {
  constructor(private page: Page) {}

  get editor() {
    return this.page.getByRole('textbox', { name: 'Printartikelredigerare' })
  }

  // Actions
  async goto(documentId: string) {
    await this.page.goto(`print-editor?id=${documentId}`)
    await this.editor.waitFor({ state: 'visible' })
  }

  async typeText(text: string) {
    await this.editor.click()
    await this.page.keyboard.insertText(text)
  }

  // Assertions
  async expectEditorVisible() {
    await expect(this.editor).toBeVisible()
  }

  async expectContent(text: string) {
    await expect(this.editor).toContainText(text)
  }
}
