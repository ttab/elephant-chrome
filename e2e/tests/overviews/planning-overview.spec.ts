import { test, expect } from '../../fixtures'

test.describe('Planning Overview @important', () => {
  test('load and display table', async ({ planningOverviewPage }) => {
    await planningOverviewPage.goto()
    await planningOverviewPage.expectTableVisible()
    await planningOverviewPage.expectRowsLoaded()
  })

  test('search filters results', async ({ planningOverviewPage, page }) => {
    await planningOverviewPage.goto()

    await planningOverviewPage.search('zzz-nonexistent-e2e-query')

    await expect(
      page.getByText('Inga resultat hittades')
    ).toBeVisible({ timeout: 5_000 })
  })

  test('click row opens planning @experimental', async ({ planningOverviewPage, page }) => {
    await planningOverviewPage.goto()

    const firstRow = planningOverviewPage.rows.first()
    await firstRow.waitFor({ state: 'visible' })

    const rowText = await firstRow.innerText()
    const title = rowText.split('\n')[0].trim()

    await firstRow.click()

    // Verify the opened panel shows the clicked item's title
    await expect(
      page.getByRole('textbox', { name: 'Planeringstitel' })
    ).toContainText(title, { timeout: 10_000 })
  })
})
