import { test, expect } from '../../fixtures'

test.describe('Events Overview @important', () => {
  test('load and display table', async ({ eventsOverviewPage }) => {
    await eventsOverviewPage.goto()
    await eventsOverviewPage.expectTableVisible()
    await eventsOverviewPage.expectRowsLoaded()
  })

  test('search filters results', async ({ eventsOverviewPage, page }) => {
    await eventsOverviewPage.goto()

    await eventsOverviewPage.search('zzz-nonexistent-e2e-query')

    await expect(
      page.getByText('Inga resultat hittades')
    ).toBeVisible({ timeout: 5_000 })
  })

  test('click row opens event @experimental', async ({ eventsOverviewPage, page }) => {
    await eventsOverviewPage.goto()

    // Use the main table (last table), skipping the NewItems table
    const mainRows = page.locator('table').last().locator('tbody tr')
    const firstRow = mainRows.first()
    await firstRow.waitFor({ state: 'visible', timeout: 10_000 })

    const rowText = await firstRow.innerText()
    const title = rowText.split('\n')[0].trim()

    await firstRow.click()

    // Verify the opened panel shows the clicked item's title
    const editor = page.getByRole('textbox', { name: 'Händelsestitel' })
    await expect(editor).toBeVisible({ timeout: 10_000 })
    await expect(editor).toContainText(title)
  })
})
