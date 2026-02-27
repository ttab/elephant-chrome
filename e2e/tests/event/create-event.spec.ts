import { test } from '../../fixtures'
import { testTitle } from '../../helpers/test-data'
import { captureDocumentId, verifyDocument } from '../../helpers/document'

test.describe('Event — Create @important', () => {
  test('create a new event as draft', async ({
    eventPage, page, request
  }) => {
    const title = testTitle('Event')

    await eventPage.openCreateDialog()
    await eventPage.fillTitle(title)
    await eventPage.selectSection('Inrikes')

    const documentId = await captureDocumentId(page, async () => {
      await eventPage.submitAsDraft()
    })

    await eventPage.expectDialogClosed()
    await verifyDocument(request, documentId, title)
  })

  test('create and publish an event', async ({
    eventPage, page, request
  }) => {
    const title = testTitle('Published Event')

    await eventPage.openCreateDialog()
    await eventPage.fillTitle(title)
    await eventPage.selectSection('Inrikes')

    const documentId = await captureDocumentId(page, async () => {
      await eventPage.submitAsPublished()
    })

    await eventPage.expectDialogClosed()
    await verifyDocument(request, documentId, title)
  })

  test('create event as intern', async ({
    eventPage, page, request
  }) => {
    const title = testTitle('Intern Event')

    await eventPage.openCreateDialog()
    await eventPage.fillTitle(title)
    await eventPage.selectSection('Inrikes')

    const documentId = await captureDocumentId(page, async () => {
      await eventPage.submitAsIntern()
    })

    await eventPage.expectDialogClosed()
    await verifyDocument(request, documentId, title)
  })
})
