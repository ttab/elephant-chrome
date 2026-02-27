import { test, expect } from '../../fixtures'

test.describe('Assignments Table @important', () => {
  test('load assignments table', async ({ assignmentsPage }) => {
    await assignmentsPage.goto()
    await assignmentsPage.expectTableVisible()
    await assignmentsPage.expectRowsLoaded()
  })

  test('search filters assignments', async ({ assignmentsPage, page }) => {
    await assignmentsPage.goto()

    await assignmentsPage.search('zzz-nonexistent-e2e-query')

    // Search with nonsense query shows "no results" message
    await expect(
      page.getByText('Inga resultat hittades')
    ).toBeVisible({ timeout: 5_000 })
  })
})
