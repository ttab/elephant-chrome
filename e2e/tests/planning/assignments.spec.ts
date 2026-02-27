import { test } from '../../fixtures'
import { testTitle } from '../../helpers/test-data'

test.describe('Planning — Assignments @critical', () => {
  const planningId = process.env.E2E_TEST_PLANNING_ID

  test.beforeEach(() => {
    test.skip(!planningId, 'E2E_TEST_PLANNING_ID not set')
  })

  test('add assignment to planning', async ({
    planningPage, page
  }) => {
    const title = testTitle('Assignment')
    await planningPage.gotoPlanning(planningId!)

    // Skip if the add button is disabled (e.g. published state)
    const addBtn = page.getByRole('button', {
      name: 'Lägg till uppdrag'
    })
    const isDisabled = await addBtn.isDisabled()
    test.skip(isDisabled, 'Add button disabled (planning is published)')

    await planningPage.addAssignment(title)
    await planningPage.expectAssignmentVisible(title)
  })
})
