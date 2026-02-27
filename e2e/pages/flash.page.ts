import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export class FlashPage {
  constructor(private page: Page) {}

  get dialog() {
    return this.page.getByRole('dialog')
  }

  get editor() {
    return this.dialog.first()
      .getByRole('textbox', { name: 'Flashredigerare' })
  }

  get sectionButton() {
    return this.dialog.first().getByRole('button', {
      name: 'Lägg till sektion'
    })
  }

  get quickArticleCheckbox() {
    return this.dialog.first().getByLabel('Skapa två på två')
  }

  get publishButton() {
    return this.dialog.first().getByRole('button', {
      name: 'Publicera'
    })
  }

  get doneButton() {
    return this.dialog.first().getByRole('button', {
      name: 'Klarmarkera'
    })
  }

  get draftButton() {
    return this.dialog.first().getByRole('button', {
      name: 'Utkast'
    })
  }

  // Actions
  async openCreateDialog() {
    await this.page.goto('events')
    await this.page.locator('header').first()
      .waitFor({ state: 'visible' })
    await this.page.locator(
      'header [aria-haspopup="menu"]'
    ).first().click()
    await this.page
      .getByRole('menuitem', { name: 'Flash' }).click()
    await this.dialog.first().waitFor({ state: 'visible' })
  }

  async selectSection(sectionName: string) {
    await this.sectionButton.click()
    await this.page.getByRole('option', {
      name: new RegExp(sectionName, 'i')
    }).click()
  }

  async uncheckQuickArticle() {
    if (await this.quickArticleCheckbox.isChecked()) {
      await this.quickArticleCheckbox.uncheck()
    }
  }

  async fillTitle(text: string) {
    await this.editor.click()
    await this.page.keyboard.press('Control+Home')
    await this.page.keyboard.insertText(text)
    // Wait for Slate → Yjs sync to update form validation.
    // A more robust approach would poll for the submit button
    // to become enabled.
    await this.page.waitForTimeout(500)
  }

  async typeContent(text: string) {
    await this.editor.click()
    await this.page.keyboard.insertText(text)
  }

  async submitAsPublished() {
    await this.publishButton.click()
    // Wait for CreatePrompt overlay (has unique "Avbryt" button)
    await this.page.getByRole('button', { name: 'Avbryt' })
      .waitFor({ state: 'visible', timeout: 5_000 })
    await this.page.getByRole('button', { name: 'Publicera' })
      .last().click()
  }

  async submitAsDone() {
    await this.doneButton.click()
    await this.page.getByRole('button', { name: 'Avbryt' })
      .waitFor({ state: 'visible', timeout: 5_000 })
    await this.page.getByRole('button', { name: 'Klarmarkera' })
      .last().click()
  }

  async submitAsDraft() {
    await this.draftButton.click()
    await this.page.getByRole('button', { name: 'Avbryt' })
      .waitFor({ state: 'visible', timeout: 5_000 })
    await this.page.getByRole('button', { name: 'Spara' }).click()
  }

  // Assertions
  async expectDialogClosed() {
    await expect(this.dialog).toBeHidden({ timeout: 15_000 })
  }

  async expectDialogVisible() {
    await expect(this.dialog.first()).toBeVisible()
  }

  async expectValidationError() {
    await expect(
      this.page.locator('svg.lucide-triangle-alert').first()
    ).toBeVisible({ timeout: 5_000 })
  }
}
