import { test } from '../../fixtures'
import { testTitle } from '../../helpers/test-data'
import { captureDocumentId, verifyDocument } from '../../helpers/document'

test.describe('Flash — Create @critical', () => {
  test('create and publish a flash', async ({
    flashPage, page, request
  }) => {
    const title = testTitle('Flash')

    await flashPage.openCreateDialog()
    await flashPage.uncheckQuickArticle()
    await flashPage.selectSection('Inrikes')
    await flashPage.fillTitle(title)

    const documentId = await captureDocumentId(page, async () => {
      await flashPage.submitAsPublished()
    })

    await flashPage.expectDialogClosed()
    await verifyDocument(request, documentId, title)
  })
})
