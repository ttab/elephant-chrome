import { test } from '../../fixtures'
import { testTitle, testSlugline } from '../../helpers/test-data'
import { captureDocumentId, verifyDocument } from '../../helpers/document'

test.describe('Quick Article — Create @secondary', () => {
  test('create quick article as draft', async ({
    quickArticlePage, page, request
  }) => {
    const title = testTitle('Quick Article')
    const slugline = testSlugline('quick')

    await quickArticlePage.openCreateDialog()
    await quickArticlePage.fillSlugline(slugline)
    await quickArticlePage.selectNewsvalue('3')
    await quickArticlePage.selectSection('Inrikes')
    await quickArticlePage.fillTitle(title)

    const documentId = await captureDocumentId(page, async () => {
      await quickArticlePage.submitAsDraft()
    })

    await quickArticlePage.expectDialogClosed()
    await verifyDocument(request, documentId, title)
  })
})
