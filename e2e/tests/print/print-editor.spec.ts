import { test } from '../../fixtures'

test.describe('Print Editor @secondary', () => {
  const printArticleId = process.env.E2E_TEST_PRINT_ARTICLE_ID

  test.beforeEach(() => {
    test.skip(!printArticleId, 'E2E_TEST_PRINT_ARTICLE_ID not set')
  })

  test('open print editor with document', async ({
    printEditorPage
  }) => {
    await printEditorPage.goto(printArticleId!)
    await printEditorPage.expectEditorVisible()
  })

  test('type text in print editor', async ({
    printEditorPage, page
  }) => {
    await printEditorPage.goto(printArticleId!)

    // Go to end of document, create new paragraph to isolate text
    await printEditorPage.editor.click()
    await page.keyboard.press('ControlOrMeta+End')
    await page.keyboard.press('Enter')

    const testText = `E2E print test ${Date.now()}`
    await page.keyboard.insertText(testText)
    await printEditorPage.expectContent(testText)
  })
})
