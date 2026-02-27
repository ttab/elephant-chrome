import { test, expect } from '../../fixtures'

test.describe('Flash — Validation @critical', () => {
  test('cannot publish without title', async ({
    flashPage,
    page
  }) => {
    await flashPage.openCreateDialog()
    await flashPage.uncheckQuickArticle()
    await flashPage.selectSection('Inrikes')
    // Skip fillTitle — leave title empty

    await flashPage.publishButton.click()
    // Validation blocks submit — dialog stays open
    await flashPage.expectDialogVisible()
    await flashPage.expectValidationError()

    // CreatePrompt should NOT have appeared
    await expect(
      page.getByRole('button', { name: 'Avbryt' })
    ).toBeHidden()
  })

  test('cannot save draft without title', async ({
    flashPage,
    page
  }) => {
    await flashPage.openCreateDialog()
    await flashPage.uncheckQuickArticle()
    await flashPage.selectSection('Inrikes')
    // Skip fillTitle

    await flashPage.draftButton.click()
    await flashPage.expectDialogVisible()
    await flashPage.expectValidationError()

    await expect(
      page.getByRole('button', { name: 'Avbryt' })
    ).toBeHidden()
  })
})
