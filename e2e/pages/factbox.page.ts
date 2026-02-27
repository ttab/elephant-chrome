import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export class FactboxPage {
  constructor(private page: Page) {}

  get dialog() {
    return this.page.getByRole('dialog')
  }

  get titleInput() {
    return this.dialog.getByRole('textbox', { name: 'Faktarutatitel' })
  }

  get editor() {
    return this.dialog.getByRole('textbox', { name: 'Faktarutaredigerare' })
  }

  get createButton() {
    return this.dialog.getByRole('button', {
      name: /skapa faktaruta/i
    })
  }

  // Actions
  async openCreateDialog() {
    await this.page.goto('events')
    await this.page.locator('header').first()
      .waitFor({ state: 'visible' })
    // Wait for table to render before opening dropdown
    await this.page.locator('table').first()
      .waitFor({ state: 'visible', timeout: 10_000 })
    // Open dropdown next to "Ny" and select Faktaruta
    await this.page.locator(
      'header [aria-haspopup="menu"]'
    ).first().click()
    const menuitem = this.page
      .getByRole('menuitem', { name: 'Faktaruta' })
    await menuitem.waitFor({ state: 'visible' })
    await menuitem.click()
    await this.dialog.waitFor({ state: 'visible' })
  }

  async fillTitle(text: string) {
    await this.titleInput.click()
    await this.page.keyboard.insertText(text)
  }

  async typeContent(text: string) {
    await this.editor.click()
    await this.page.keyboard.insertText(text)
  }

  async create() {
    await this.createButton.click()
  }

  // Assertions
  async expectCreateDisabled() {
    await expect(this.createButton).toBeDisabled()
  }

  async expectCreateEnabled() {
    await expect(this.createButton).toBeEnabled()
  }

  async expectDialogClosed() {
    await expect(this.dialog).toBeHidden({ timeout: 15_000 })
  }
}
