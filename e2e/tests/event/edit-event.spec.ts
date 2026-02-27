import { test, expect } from '../../fixtures'
import { testTitle } from '../../helpers/test-data'

test.describe('Event — Edit @important', () => {
  const eventId = process.env.E2E_TEST_EVENT_ID

  test.beforeEach(() => {
    test.skip(!eventId, 'E2E_TEST_EVENT_ID not set')
  })

  test('open and edit event title', async ({ page }) => {
    const newTitle = testTitle('Edited Event')

    await page.goto(`event?id=${eventId}`)
    const title = page.getByRole('textbox', { name: 'Händelsestitel' })
    await title.waitFor({ state: 'visible' })

    // Triple-click to select all text in the Slate field, then replace
    await title.click({ clickCount: 3 })
    await page.keyboard.insertText(newTitle)

    // Wait for typed text to appear in the DOM, then allow Yjs
    // to sync the change to the server before reloading.
    await expect(title).toContainText(newTitle, { timeout: 5_000 })
    await page.waitForTimeout(2_000)

    await page.reload()
    await title.waitFor({ state: 'visible' })
    await expect(title).toContainText(newTitle)
  })
})
