import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export class EditorPage {
  constructor(private page: Page) {}

  // Locators
  get editor() {
    return this.page.getByRole('textbox', { name: 'Artikelredigerare' })
  }

  get statusButton() {
    return this.page.getByRole('button', {
      name: /Utkast|Klar|Godkänd|Publicerad|Schemalagd|Avpublicerad/i
    })
  }

  // Actions
  async goto(documentId: string) {
    await this.page.goto(`editor?id=${documentId}`)
    await this.editor.waitFor({ state: 'visible' })
  }

  /** Navigate to article without waiting for editable state. */
  async gotoView(documentId: string) {
    await this.page.goto(`editor?id=${documentId}`)
    await this.statusButton.waitFor({ state: 'visible' })
  }

  async gotoPreview(documentId: string) {
    await this.page.goto(`editor?id=${documentId}&preview=true`)
  }

  async typeText(text: string) {
    await this.editor.click()
    await this.page.keyboard.insertText(text)
  }

  async selectAll() {
    await this.page.keyboard.press('ControlOrMeta+a')
  }

  async bold() {
    await this.page.keyboard.press('ControlOrMeta+b')
  }

  async italic() {
    await this.page.keyboard.press('ControlOrMeta+i')
  }

  async undo() {
    await this.page.keyboard.press('ControlOrMeta+z')
  }

  async redo() {
    await this.page.keyboard.press('ControlOrMeta+Shift+z')
  }

  async changeStatus(
    action: 'Klarmarkera' | 'Godkänn' | 'Publicera'
      | 'Schemalägg publicering' | 'Avpublicera' | 'Ny version'
  ) {
    await this.statusButton.click()
    await this.page.getByRole('menuitem', {
      name: new RegExp(`^${action}`, 'i')
    }).click()

    // Workflow transitions show a verification dialog
    const dialog = this.page.getByRole('dialog')
    await dialog.waitFor({ state: 'visible', timeout: 5_000 })

    // Some transitions require selecting a cause/reason
    const reasonSelect = dialog.getByRole('combobox')
    try {
      await reasonSelect.waitFor({ state: 'visible', timeout: 2_000 })
      await reasonSelect.click()
      await this.page.getByRole('option').first().click()
    } catch { /* no reason select for this transition */ }

    await dialog.getByRole('button', {
      name: new RegExp(`^${action}`, 'i')
    }).click()
    await dialog.waitFor({ state: 'hidden', timeout: 10_000 })
  }

  /** Navigate to article and ensure it's in draft state. */
  async ensureDraft(documentId: string) {
    await this.page.goto(`editor?id=${documentId}`)
    await this.statusButton.waitFor({ state: 'visible' })
    let text = await this.statusButton.textContent()

    if (text && /utkast/i.test(text)) return

    // From "Godkänd" there's no direct path to draft.
    // Advance to "Publicerad" first so "Ny version" is available.
    if (text && /godkänd/i.test(text)) {
      await this.changeStatus('Publicera')
      await this.page.goto(`editor?id=${documentId}`)
      await this.statusButton.waitFor({ state: 'visible' })
      text = await this.statusButton.textContent()
    }

    if (text && /utkast/i.test(text)) return

    // From "Publicerad"/"Avpublicerad": "Ny version"
    // From "Klar": "Till utkast"
    await this.statusButton.click()
    const toDraft = this.page.getByRole('menuitem', {
      name: /ny version|till utkast/i
    })

    let toDraftVisible = false
    try {
      await toDraft.waitFor({ state: 'visible', timeout: 3_000 })
      toDraftVisible = true
    } catch { /* menu item not available */ }

    if (toDraftVisible) {
      await toDraft.click()

      const dialog = this.page.getByRole('dialog')
      await dialog.waitFor({ state: 'visible' })

      const reasonSelect = dialog.getByRole('combobox')
      try {
        await reasonSelect.waitFor({
          state: 'visible', timeout: 2_000
        })
        await reasonSelect.click()
        await this.page.getByRole('option').first().click()
      } catch { /* no reason select */ }

      await dialog.getByRole('button', {
        name: /ny version|till utkast/i
      }).click()
      await dialog.waitFor({ state: 'hidden', timeout: 10_000 })
      await this.editor.waitFor({
        state: 'visible', timeout: 15_000
      })
    } else {
      await this.page.keyboard.press('Escape')
    }
  }

  async openMetaSheet() {
    const sheet = this.page.locator('[role="dialog"]')
    if (await sheet.isVisible()) return
    // MetaSheet trigger is the first button in the Action section
    // (last direct child of the <header>)
    await this.page
      .locator('header > :last-child button')
      .first()
      .click()
    await sheet.waitFor({ state: 'visible' })
  }

  async closeMetaSheet() {
    const dialog = this.page.locator('[role="dialog"]')
    if (!await dialog.isVisible()) return
    await dialog.getByRole('button').first().click()
    await dialog.waitFor({ state: 'hidden' })
  }

  // Assertions
  async expectContent(text: string) {
    await expect(this.editor).toContainText(text)
  }

  async expectStatus(status: string) {
    await expect(this.statusButton).toContainText(
      new RegExp(status, 'i')
    )
  }

  async expectReadOnly() {
    await expect(
      this.page.getByRole('textbox', { name: 'Artikelredigerare' })
    ).toHaveAttribute('contenteditable', 'false')
  }
}
