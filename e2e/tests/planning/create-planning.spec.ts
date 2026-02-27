import { test } from '../../fixtures'
import { testTitle, testSlugline } from '../../helpers/test-data'
import { captureDocumentId, verifyDocument } from '../../helpers/document'

test.describe('Planning — Create @critical', () => {
  test('create a new planning as draft', async ({
    planningPage, page, request
  }) => {
    const title = testTitle('Planning')

    await planningPage.openCreateDialog()
    await planningPage.fillTitle(title)
    await planningPage.fillSlugline(testSlugline('planning'))
    await planningPage.selectNewsvalue('3')
    await planningPage.selectSection('Inrikes')

    const documentId = await captureDocumentId(page, async () => {
      await planningPage.submitAsDraft()
    })

    await planningPage.expectDialogClosed()
    await verifyDocument(request, documentId, title)
  })

  test('create and publish a planning', async ({
    planningPage, page, request
  }) => {
    const title = testTitle('Published Planning')

    await planningPage.openCreateDialog()
    await planningPage.fillTitle(title)
    await planningPage.fillSlugline(testSlugline('planning'))
    await planningPage.selectNewsvalue('3')
    await planningPage.selectSection('Inrikes')

    const documentId = await captureDocumentId(page, async () => {
      await planningPage.submitAsPublished()
    })

    await planningPage.expectDialogClosed()
    await verifyDocument(request, documentId, title)
  })

  test('create planning as intern', async ({
    planningPage, page, request
  }) => {
    const title = testTitle('Intern Planning')

    await planningPage.openCreateDialog()
    await planningPage.fillTitle(title)
    await planningPage.fillSlugline(testSlugline('planning'))
    await planningPage.selectNewsvalue('3')
    await planningPage.selectSection('Inrikes')

    const documentId = await captureDocumentId(page, async () => {
      await planningPage.submitAsIntern()
    })

    await planningPage.expectDialogClosed()
    await verifyDocument(request, documentId, title)
  })
})
