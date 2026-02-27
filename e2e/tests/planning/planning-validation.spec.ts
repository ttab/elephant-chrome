import { test } from '../../fixtures'
import { testTitle, testSlugline } from '../../helpers/test-data'

test.describe('Planning — Validation @critical', () => {
  test('cannot submit without title', async ({ planningPage }) => {
    const slugline = testSlugline('notitle')

    await planningPage.openCreateDialog()
    await planningPage.fillSlugline(slugline)
    await planningPage.selectNewsvalue('3')
    await planningPage.selectSection('Inrikes')
    // Skip fillTitle

    await planningPage.submitAsDraft()
    await planningPage.expectDialogVisible()
    await planningPage.expectValidationError()
  })

  test('cannot submit without newsvalue', async ({
    planningPage
  }) => {
    const title = testTitle('No Newsvalue')
    const slugline = testSlugline('nonews')

    await planningPage.openCreateDialog()
    await planningPage.fillTitle(title)
    await planningPage.fillSlugline(slugline)
    // Skip selectNewsvalue
    await planningPage.selectSection('Inrikes')

    await planningPage.submitAsDraft()
    await planningPage.expectDialogVisible()
    await planningPage.expectValidationError()
  })

  test('cannot submit without section', async ({ planningPage }) => {
    const title = testTitle('No Section')
    const slugline = testSlugline('nosec')

    await planningPage.openCreateDialog()
    await planningPage.fillTitle(title)
    await planningPage.fillSlugline(slugline)
    await planningPage.selectNewsvalue('3')
    // Skip selectSection

    await planningPage.submitAsDraft()
    await planningPage.expectDialogVisible()
    await planningPage.expectValidationError()
  })
})
