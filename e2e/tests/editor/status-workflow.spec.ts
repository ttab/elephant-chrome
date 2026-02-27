import { test } from '../../fixtures'

// These tests run in order and mutate the document status.
// The first test ensures draft state; the last resets back to draft.
test.describe.serial('Editor — Status Workflow @critical', () => {
  const articleId = process.env.E2E_TEST_ARTICLE_ID

  test.beforeEach(() => {
    test.skip(!articleId, 'E2E_TEST_ARTICLE_ID not set')
  })

  test('ensure article starts as draft', async ({ editorPage }) => {
    await editorPage.ensureDraft(articleId!)
  })

  test('change status from draft to done', async ({
    editorPage, page
  }) => {
    await editorPage.goto(articleId!)
    await editorPage.expectStatus('Utkast')

    // Ensure newsvalue is set — required for status transitions
    const newsvalueBtn = page.getByRole('button', {
      name: /lägg till nyhetsvärde/i
    })
    if (await newsvalueBtn.isVisible()) {
      await newsvalueBtn.click()
      await page.getByRole('option').first().click()
    }

    await editorPage.changeStatus('Klarmarkera')
    await editorPage.expectStatus('Klar')
  })

  test('approve document', async ({ editorPage }) => {
    await editorPage.goto(articleId!)
    await editorPage.expectStatus('Klar')

    await editorPage.changeStatus('Godkänn')
    await editorPage.expectStatus('Godkänd')
  })

  test('publish document', async ({ editorPage }) => {
    await editorPage.gotoView(articleId!)
    await editorPage.expectStatus('Godkänd')

    await editorPage.changeStatus('Publicera')
    await editorPage.expectStatus('Publicerad')
  })

  test('reset document to draft via new version', async ({
    editorPage, page
  }) => {
    await editorPage.gotoView(articleId!)
    await editorPage.expectStatus('Publicerad')

    await editorPage.changeStatus('Ny version')
    await editorPage.expectStatus('Utkast')

    // Reload and verify status persisted
    await page.reload()
    await editorPage.statusButton.waitFor({ state: 'visible' })
    await editorPage.expectStatus('Utkast')
  })
})
