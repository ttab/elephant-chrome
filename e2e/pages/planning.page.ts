import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export class PlanningPage {
  constructor(private page: Page) {}

  get dialog() {
    return this.page.getByRole('dialog')
  }

  get title() {
    return this.dialog.getByRole('textbox', { name: 'Planeringstitel' })
  }

  // Slugline is the 4th textbox in the dialog
  // (after title, description, internal message)
  get slugline() {
    return this.dialog.getByRole('textbox').nth(3)
  }

  get newsvalueButton() {
    return this.dialog.getByRole('button', {
      name: 'Lägg till nyhetsvärde'
    })
  }

  get sectionButton() {
    return this.dialog.getByRole('button', {
      name: 'Lägg till sektion'
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

  // Planning view locators (not dialog)
  get addAssignmentButton() {
    return this.page.getByRole('button', {
      name: 'Lägg till uppdrag'
    })
  }

  get assignmentTitle() {
    return this.page.getByPlaceholder('Uppdragstitel')
  }

  get assignmentSubmitButton() {
    return this.page.getByRole('button', { name: 'Lägg till' })
  }

  get assignmentCancelButton() {
    return this.page.getByRole('button', { name: 'Avbryt' })
  }

  // Actions
  async openCreateDialog() {
    await this.page.goto('plannings')
    await this.page.locator('header').first()
      .waitFor({ state: 'visible' })
    await this.page.getByRole('button', { name: 'Ny' }).click()
    await this.dialog.waitFor({ state: 'visible' })
  }

  async fillTitle(text: string) {
    await this.title.click()
    await this.page.keyboard.insertText(text)
  }

  async fillSlugline(text: string) {
    await this.slugline.click()
    await this.page.keyboard.insertText(text)
  }

  async selectNewsvalue(value: string) {
    await this.newsvalueButton.click()
    await this.page.getByRole('option', {
      name: new RegExp(`^${value}$`)
    }).click()
  }

  async selectSection(sectionName: string) {
    await this.sectionButton.click()
    await this.page.getByRole('option', {
      name: new RegExp(sectionName, 'i')
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

  async gotoPlanning(planningId: string) {
    await this.page.goto(`planning?id=${planningId}`)
    await this.page.locator('header').first()
      .waitFor({ state: 'visible' })
  }

  async addAssignment(title: string) {
    await this.addAssignmentButton.click()
    await this.assignmentTitle.waitFor({ state: 'visible' })
    await this.assignmentTitle.click()
    await this.page.keyboard.insertText(title)
    await this.assignmentSubmitButton.click()
  }

  // Assertions
  async expectDialogClosed() {
    await expect(this.dialog).toBeHidden({ timeout: 15_000 })
  }

  async expectDialogVisible() {
    await expect(this.dialog).toBeVisible()
  }

  async expectAssignmentVisible(title: string) {
    await expect(
      this.page.getByText(title)
    ).toBeVisible({ timeout: 10_000 })
  }

  async expectValidationError() {
    await expect(
      this.page.locator('svg.lucide-triangle-alert').first()
    ).toBeVisible({ timeout: 5_000 })
  }
}
