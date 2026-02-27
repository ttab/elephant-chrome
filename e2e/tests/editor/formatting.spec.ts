import { test, expect } from '../../fixtures'
import { restoreDocument } from '../../helpers/api'

test.describe('Editor — Formatting @critical', () => {
  const articleId = process.env.E2E_TEST_ARTICLE_ID
  const restoreVersion = process.env.E2E_TEST_ARTICLE_RESTORE_VERSION

  test.beforeEach(async (_fixtures, testInfo) => {
    test.skip(!articleId, 'E2E_TEST_ARTICLE_ID not set')

    const baseURL = testInfo.project.use.baseURL
    if (baseURL && restoreVersion) {
      await restoreDocument(baseURL, articleId!, Number(restoreVersion))
    }
  })

  test('apply bold to text', async ({ editorPage, page }) => {
    await editorPage.ensureDraft(articleId!)
    const testText = `bold${Date.now()}`

    await editorPage.editor.click()
    await page.keyboard.press('ControlOrMeta+End')
    await page.keyboard.press('Enter')
    await page.keyboard.insertText(testText)
    await editorPage.expectContent(testText)

    await page.getByText(testText).click({ clickCount: 3 })
    await editorPage.bold()

    const boldText = page.locator('span.font-bold')
      .filter({ hasText: testText })
    await expect(boldText).toBeVisible()
  })

  test('apply italic to text', async ({ editorPage, page }) => {
    await editorPage.ensureDraft(articleId!)
    const testText = `ital${Date.now()}`

    await editorPage.editor.click()
    await page.keyboard.press('ControlOrMeta+End')
    await page.keyboard.press('Enter')
    await page.keyboard.insertText(testText)
    await editorPage.expectContent(testText)

    await page.getByText(testText).click({ clickCount: 3 })
    await editorPage.italic()

    const italicText = page.locator('span.italic')
      .filter({ hasText: testText })
    await expect(italicText).toBeVisible()
  })

  test('toggle bold off selected text', async ({
    editorPage, page
  }) => {
    await editorPage.ensureDraft(articleId!)
    const testText = `togbold${Date.now()}`

    // Type plain text, select, apply bold
    await editorPage.editor.click()
    await page.keyboard.press('ControlOrMeta+End')
    await page.keyboard.press('Enter')
    await page.keyboard.insertText(testText)
    await editorPage.expectContent(testText)

    await page.getByText(testText).click({ clickCount: 3 })
    await editorPage.bold()

    const boldText = page.locator('span.font-bold')
      .filter({ hasText: testText })
    await expect(boldText).toBeVisible()

    // Triple-click again to select, toggle bold off
    await boldText.click({ clickCount: 3 })
    await editorPage.bold()

    await expect(boldText).not.toBeVisible()
    await expect(page.getByText(testText)).toBeVisible()
  })
})
