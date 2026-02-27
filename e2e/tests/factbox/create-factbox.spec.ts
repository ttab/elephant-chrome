import { test } from '../../fixtures'
import { testTitle } from '../../helpers/test-data'
import { captureDocumentId, verifyDocument } from '../../helpers/document'

test.describe('Factbox — Create @secondary', () => {
  test('create factbox with title and content', async ({
    factboxPage, page, request
  }) => {
    const title = testTitle('Factbox')

    await factboxPage.openCreateDialog()

    await factboxPage.fillTitle(title)
    await factboxPage.typeContent('Factbox content for testing')

    await factboxPage.expectCreateEnabled()

    const documentId = await captureDocumentId(page, async () => {
      await factboxPage.create()
    })

    await factboxPage.expectDialogClosed()
    await verifyDocument(request, documentId)
  })
})
