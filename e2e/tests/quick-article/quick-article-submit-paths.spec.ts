import { test } from '../../fixtures'
import { testTitle, testSlugline } from '../../helpers/test-data'
import { captureDocumentId, verifyDocument } from '../../helpers/document'

test.describe('Quick Article — Submit Paths @secondary', () => {
  test('approve quick article', async ({
    quickArticlePage, page, request
  }) => {
    const title = testTitle('Approved Article')
    const slugline = testSlugline('approve')

    await quickArticlePage.openCreateDialog()
    await quickArticlePage.fillSlugline(slugline)
    await quickArticlePage.selectNewsvalue('3')
    await quickArticlePage.selectSection('Inrikes')
    await quickArticlePage.fillTitle(title)

    const documentId = await captureDocumentId(page, async () => {
      await quickArticlePage.submitAsApproved()
    })

    await quickArticlePage.expectDialogClosed()
    await verifyDocument(request, documentId, title)
  })

  test('mark quick article as done', async ({
    quickArticlePage, page, request
  }) => {
    const title = testTitle('Done Article')
    const slugline = testSlugline('done')

    await quickArticlePage.openCreateDialog()
    await quickArticlePage.fillSlugline(slugline)
    await quickArticlePage.selectNewsvalue('3')
    await quickArticlePage.selectSection('Inrikes')
    await quickArticlePage.fillTitle(title)

    const documentId = await captureDocumentId(page, async () => {
      await quickArticlePage.submitAsDone()
    })

    await quickArticlePage.expectDialogClosed()
    await verifyDocument(request, documentId, title)
  })
})
