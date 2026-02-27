import { test, expect } from '../../fixtures'

test.describe('Factboxes Overview @important', () => {
  test('load and display table', async ({ factboxesPage }) => {
    await factboxesPage.goto()
    await factboxesPage.expectTableVisible()
    await factboxesPage.expectRowsLoaded()
  })

  test('search filters results', async ({ factboxesPage, page }) => {
    await factboxesPage.goto()
    await factboxesPage.search('zzz-nonexistent-e2e-query')
    await expect(
      page.getByText('Inga resultat hittades')
    ).toBeVisible({ timeout: 5_000 })
  })

  test('click row opens factbox @experimental', async ({
    factboxesPage,
    page
  }) => {
    await factboxesPage.goto()

    const firstRow = factboxesPage.rows.first()
    await firstRow.waitFor({ state: 'visible' })

    const rowText = await firstRow.innerText()
    const title = rowText.split('\n')[0].trim()

    await firstRow.click()

    // Verify the opened panel shows the clicked item's title
    await expect(
      page.getByRole('textbox', { name: 'Faktarutatitel' })
    ).toContainText(title, { timeout: 10_000 })
  })
})
