import { test, expect } from '../../fixtures'

test.describe('Wires @secondary', () => {
  test('load wire list', async ({ wiresPage }) => {
    await wiresPage.goto()
    await wiresPage.expectTableVisible()
    await wiresPage.expectRowsLoaded()
  })

  test('wire rows are interactive', async ({ wiresPage }) => {
    await wiresPage.goto()

    const firstRow = wiresPage.rows.first()
    await firstRow.waitFor({ state: 'visible' })

    // Verify rows have tabindex for keyboard navigation
    await expect(firstRow).toHaveAttribute('tabindex', '0')
  })

  test('click wire opens preview', async ({ wiresPage, page }) => {
    await wiresPage.goto()

    const firstRow = wiresPage.rows.first()
    await firstRow.waitFor({ state: 'visible' })
    await firstRow.click()

    // Verify the wire preview panel opened
    await expect(
      page.locator('header').nth(1)
    ).toBeVisible({ timeout: 10_000 })
  })
})
