import { test, expect } from '../../fixtures'

test.describe('Approvals Grid @important', () => {
  test('load approvals grid', async ({ approvalsPage }) => {
    await approvalsPage.goto()
    await approvalsPage.expectGridVisible()
  })

  test('navigate with arrow keys', async ({ approvalsPage, page }) => {
    await approvalsPage.goto()

    // The view auto-focuses a card on load via useEffect.
    const focusedCard = page.locator('div[tabindex="0"].rounded:focus')
    await expect(focusedCard).toBeVisible({ timeout: 5_000 })

    const initialBox = await focusedCard.boundingBox()

    await approvalsPage.navigateDown()

    // After ArrowDown, focus should have moved vertically
    await expect(focusedCard).toBeVisible()
    const afterBox = await focusedCard.boundingBox()
    expect(afterBox?.y).not.toEqual(initialBox?.y)

    await approvalsPage.navigateRight()
    await approvalsPage.navigateLeft()
    await approvalsPage.navigateUp()

    await approvalsPage.expectGridVisible()
  })

  test('open card from grid', async ({ approvalsPage, page }) => {
    await approvalsPage.goto()
    await approvalsPage.expectGridVisible()

    const firstCard = approvalsPage.cards.first()
    await firstCard.waitFor({ state: 'visible', timeout: 10_000 })
    await firstCard.click()

    await approvalsPage.openFocusedCard()

    // Verify the editor opened with editable content
    await expect(
      page.getByRole('textbox', { name: 'Artikelredigerare' })
    ).toBeVisible({ timeout: 10_000 })
  })

  test('preview card with Space', async ({ approvalsPage, page }) => {
    await approvalsPage.goto()
    await approvalsPage.expectGridVisible()

    const firstCard = approvalsPage.cards.first()
    await firstCard.waitFor({ state: 'visible', timeout: 10_000 })
    await firstCard.click()

    await approvalsPage.previewFocusedCard()

    // Verify the editor opened with editable content
    await expect(
      page.getByRole('textbox', { name: 'Artikelredigerare' })
    ).toBeVisible({ timeout: 10_000 })
  })
})
