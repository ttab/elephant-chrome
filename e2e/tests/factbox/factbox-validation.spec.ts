import { test } from '../../fixtures'
import { testTitle } from '../../helpers/test-data'

test.describe('Factbox — Validation @secondary', () => {
  test('create button disabled without title', async ({
    factboxPage
  }) => {
    await factboxPage.openCreateDialog()

    // Without filling title, the create button should be disabled
    await factboxPage.expectCreateDisabled()

    // After filling title, it should become enabled
    const title = testTitle('Factbox')
    await factboxPage.fillTitle(title)
    await factboxPage.expectCreateEnabled()
  })
})
