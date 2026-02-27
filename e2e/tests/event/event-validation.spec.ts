import { test } from '../../fixtures'

test.describe('Event — Validation @important', () => {
  test('cannot submit without title', async ({ eventPage }) => {
    await eventPage.openCreateDialog()

    // Submit as draft without filling anything
    await eventPage.submitAsDraft()

    // Dialog should stay open because validation prevents submission
    await eventPage.expectDialogVisible()
    await eventPage.expectValidationError()
  })
})
