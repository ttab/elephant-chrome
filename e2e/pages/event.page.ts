import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export class EventPage {
  constructor(private page: Page) {}

  get dialog() {
    return this.page.getByRole('dialog')
  }

  get title() {
    return this.dialog.getByRole('textbox', { name: 'Händelsestitel' })
  }

  get sectionButton() {
    return this.dialog.getByRole('button', {
      name: 'Lägg till sektion'
    })
  }

  get newsvalueButton() {
    return this.dialog.getByRole('button', {
      name: 'Lägg till nyhetsvärde'
    })
  }

  get publishButton() {
    return this.dialog.getByRole('button', { name: 'Publicera' })
  }

  get internButton() {
    return this.dialog.getByRole('button', { name: 'Intern' })
  }

  get draftButton() {
    return this.dialog.getByRole('button', { name: 'Utkast' })
  }

  // Actions
  async openCreateDialog() {
    await this.page.goto('events')
    await this.page.locator('header').first()
      .waitFor({ state: 'visible' })
    await this.page.getByRole('button', { name: 'Ny' }).click()
    await this.dialog.waitFor({ state: 'visible' })
  }

  async fillTitle(text: string) {
    await this.title.click()
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

  async submitAsDraft() {
    await this.draftButton.click()
  }

  async submitAsPublished() {
    await this.publishButton.click()
  }

  async submitAsIntern() {
    await this.internButton.click()
  }

  // Assertions
  async expectDialogClosed() {
    await expect(this.dialog).toBeHidden({ timeout: 15_000 })
  }

  async expectDialogVisible() {
    await expect(this.dialog).toBeVisible()
  }

  async expectValidationError() {
    await expect(
      this.page.locator('svg.lucide-triangle-alert').first()
    ).toBeVisible({ timeout: 5_000 })
  }
}
