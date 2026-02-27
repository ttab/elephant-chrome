import { test } from '../../fixtures'
import { testTitle } from '../../helpers/test-data'
import { captureDocumentId, verifyDocument } from '../../helpers/document'

test.describe('Flash — Submit Paths @critical', () => {
  test('create flash as draft', async ({
    flashPage, page, request
  }) => {
    const title = testTitle('Flash Draft')

    await flashPage.openCreateDialog()
    await flashPage.uncheckQuickArticle()
    await flashPage.selectSection('Inrikes')
    await flashPage.fillTitle(title)

    const documentId = await captureDocumentId(page, async () => {
      await flashPage.submitAsDraft()
    })

    await flashPage.expectDialogClosed()
    await verifyDocument(request, documentId, title)
  })

  test('create flash and mark done', async ({
    flashPage, page, request
  }) => {
    const title = testTitle('Flash Done')

    await flashPage.openCreateDialog()
    await flashPage.uncheckQuickArticle()
    await flashPage.selectSection('Inrikes')
    await flashPage.fillTitle(title)

    const documentId = await captureDocumentId(page, async () => {
      await flashPage.submitAsDone()
    })

    await flashPage.expectDialogClosed()
    await verifyDocument(request, documentId, title)
  })
})
