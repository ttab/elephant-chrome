import { test, expect } from '../../fixtures'
import { testTitle, testSlugline } from '../../helpers/test-data'

test.describe('Quick Article — Validation @secondary', () => {
  test('cannot submit without title', async ({
    quickArticlePage,
    page
  }) => {
    const slugline = testSlugline('notitle')

    await quickArticlePage.openCreateDialog()
    await quickArticlePage.fillSlugline(slugline)
    await quickArticlePage.selectNewsvalue('3')
    await quickArticlePage.selectSection('Inrikes')
    // Skip fillTitle

    await quickArticlePage.draftButton.click()
    await quickArticlePage.expectDialogVisible()
    await quickArticlePage.expectValidationError()

    await expect(
      page.getByRole('button', { name: 'Avbryt' })
    ).toBeHidden()
  })

  test('cannot submit without newsvalue', async ({
    quickArticlePage,
    page
  }) => {
    const title = testTitle('No Newsvalue')
    const slugline = testSlugline('nonews')

    await quickArticlePage.openCreateDialog()
    await quickArticlePage.fillSlugline(slugline)
    // Skip selectNewsvalue
    await quickArticlePage.selectSection('Inrikes')
    await quickArticlePage.fillTitle(title)

    await quickArticlePage.draftButton.click()
    await quickArticlePage.expectDialogVisible()
    await quickArticlePage.expectValidationError()

    await expect(
      page.getByRole('button', { name: 'Avbryt' })
    ).toBeHidden()
  })

  test('cannot submit without section', async ({
    quickArticlePage,
    page
  }) => {
    const title = testTitle('No Section')
    const slugline = testSlugline('nosec')

    await quickArticlePage.openCreateDialog()
    await quickArticlePage.fillSlugline(slugline)
    await quickArticlePage.selectNewsvalue('3')
    // Skip selectSection
    await quickArticlePage.fillTitle(title)

    await quickArticlePage.draftButton.click()
    await quickArticlePage.expectDialogVisible()
    await quickArticlePage.expectValidationError()

    await expect(
      page.getByRole('button', { name: 'Avbryt' })
    ).toBeHidden()
  })
})
