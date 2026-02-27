import { test, expect } from '../../fixtures'

test.describe('Editor — Basic Editing @critical', () => {
  const articleId = process.env.E2E_TEST_ARTICLE_ID

  test.beforeEach(() => {
    test.skip(!articleId, 'E2E_TEST_ARTICLE_ID not set')
  })

  test('open document and verify editor is editable', async ({
    editorPage
  }) => {
    await editorPage.goto(articleId!)
    await expect(editorPage.editor).toBeVisible()
    await expect(editorPage.editor).toBeEditable()
  })

  test('type text in editor', async ({ editorPage, page }) => {
    await editorPage.ensureDraft(articleId!)
    const testText = `E2E typing test ${Date.now()}`

    // Press Enter to create a new paragraph so typed text is isolated
    await editorPage.editor.click()
    await page.keyboard.press('End')
    await page.keyboard.press('Enter')
    await page.keyboard.insertText(testText)
    await editorPage.expectContent(testText)
  })

  test('undo and redo text', async ({ editorPage, page }) => {
    await editorPage.ensureDraft(articleId!)
    const testText = `E2E undo test ${Date.now()}`

    await editorPage.editor.click()
    await page.keyboard.press('End')
    await page.keyboard.press('Enter')
    await page.keyboard.insertText(testText)
    await editorPage.expectContent(testText)

    await editorPage.undo()
    await expect(editorPage.editor).not.toContainText(testText)

    await editorPage.redo()
    await editorPage.expectContent(testText)
  })
})
