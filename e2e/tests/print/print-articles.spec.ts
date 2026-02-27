import { test, expect } from '../../fixtures'

test.describe('Print Articles @secondary', () => {
  test('load print articles table', async ({ printArticlesPage }) => {
    await printArticlesPage.goto()
    await printArticlesPage.expectTableVisible()
    await printArticlesPage.expectRowsLoaded()
  })

  test('click row opens print editor @experimental', async ({
    page,
    printArticlesPage
  }) => {
    await printArticlesPage.goto()

    const firstRow = printArticlesPage.rows.first()
    await firstRow.waitFor({ state: 'visible' })

    const rowText = await firstRow.innerText()
    const title = rowText.split('\n')[0].trim()

    await firstRow.click()

    // Verify the opened panel shows the clicked item's title
    await expect(
      page.getByRole('textbox').first()
    ).toContainText(title, { timeout: 10_000 })
  })
})
