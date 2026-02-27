import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export class QuickArticlePage {
  constructor(private page: Page) {}

  get dialog() {
    return this.page.getByRole('dialog')
  }

  get editor() {
    return this.dialog.first()
      .getByRole('textbox', { name: 'Artikelredigerare' })
  }

  get slugline() {
    return this.dialog.first().getByRole('textbox').first()
  }

  get sectionButton() {
    return this.dialog.first().getByRole('button', {
      name: 'Lägg till sektion'
    })
  }

  get newsvalueButton() {
    return this.dialog.first().getByRole('button', {
      name: 'Lägg till nyhetsvärde'
    })
  }

  get approveButton() {
    return this.dialog.first().getByRole('button', {
      name: 'Godkänn'
    })
  }

  get doneButton() {
    return this.dialog.first().getByRole('button', {
      name: 'Klarmarkera'
    })
  }

  get draftButton() {
    return this.dialog.first().getByRole('button', {
      name: /utkast/i
    })
  }

  // Actions
  async openCreateDialog() {
    await this.page.goto('plannings')
    await this.page.locator('header').first()
      .waitFor({ state: 'visible' })
    await this.page.locator(
      'header [aria-haspopup="menu"]'
    ).first().click()
    await this.page
      .getByRole('menuitem', { name: 'Två på två' }).click()
    await this.dialog.first().waitFor({ state: 'visible' })
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

  async fillSlugline(text: string) {
    await this.slugline.click()
    await this.page.keyboard.insertText(text)
  }

  async selectSection(sectionName: string) {
    await this.sectionButton.click()
    await this.page.getByRole('option', {
      name: new RegExp(sectionName, 'i')
    }).click()
  }

  async selectNewsvalue(value: string) {
    await this.newsvalueButton.click()
    await this.page.getByRole('option', {
      name: new RegExp(`^${value}$`)
    }).click()
  }

  async typeContent(text: string) {
    await this.editor.click()
    await this.page.keyboard.insertText(text)
  }

  async submitAsApproved() {
    await this.approveButton.click()
    // The form may show a verification dialog or submit directly
    try {
      await this.page.getByRole('button', { name: 'Avbryt' })
        .waitFor({ state: 'visible', timeout: 3_000 })
      await this.page.getByRole('button', { name: 'Godkänn' })
        .last().click()
    } catch {
      // No verification dialog — form submitted directly
    }
  }

  async submitAsDone() {
    await this.doneButton.click()
    // The form may show a verification dialog or submit directly
    try {
      await this.page.getByRole('button', { name: 'Avbryt' })
        .waitFor({ state: 'visible', timeout: 3_000 })
      await this.page.getByRole('button', { name: 'Klarmarkera' })
        .last().click()
    } catch {
      // No verification dialog — form submitted directly
    }
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
