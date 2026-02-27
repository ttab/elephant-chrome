import { test, expect } from '../../fixtures'

test.describe('Editor — Metadata @secondary', () => {
  const articleId = process.env.E2E_TEST_ARTICLE_ID

  test.beforeEach(() => {
    test.skip(!articleId, 'E2E_TEST_ARTICLE_ID not set')
  })

  test('open and close meta sheet', async ({ editorPage, page }) => {
    await editorPage.goto(articleId!)

    await editorPage.openMetaSheet()
    await expect(page.getByText('Metadata')).toBeVisible()

    await editorPage.closeMetaSheet()
    await expect(
      page.locator('[role="dialog"]')
    ).not.toBeVisible()
  })

  test('newsvalue dropdown opens in meta sheet', async ({
    editorPage, page
  }) => {
    await editorPage.goto(articleId!)
    await editorPage.openMetaSheet()

    // The properties section has id="properties" in the meta sheet
    const props = page.locator('#properties')
    await expect(props).toBeVisible({ timeout: 5_000 })

    // First button in properties is the Newsvalue ComboBox
    const newsvalueBtn = props.getByRole('button').first()
    await newsvalueBtn.click()

    // Verify the dropdown opens with options
    const option = page.getByRole('option').first()
    await expect(option).toBeVisible({ timeout: 5_000 })

    // Close without changing value
    await page.keyboard.press('Escape')
  })

  test('slugline visible in meta sheet', async ({
    editorPage, page
  }) => {
    await editorPage.goto(articleId!)
    await editorPage.openMetaSheet()

    // The properties section has id="properties"
    const props = page.locator('#properties')
    await expect(props).toBeVisible({ timeout: 5_000 })

    // SluglineButton shows the slugline value or "Slugg..." placeholder
    await expect(
      props.getByText(/Slugg/i)
        .or(props.locator(':scope > :nth-child(2)'))
    ).toBeVisible({ timeout: 5_000 })
  })
})
