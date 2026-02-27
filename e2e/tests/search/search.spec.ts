import { test, expect } from '../../fixtures'

test.describe('Search @important', () => {
  test('search plannings', async ({ searchPage }) => {
    await searchPage.goto()
    await searchPage.selectType('Planeringar')
    await searchPage.search('test')

    await searchPage.expectResults()
  })

  test('search events', async ({ searchPage }) => {
    await searchPage.goto()
    await searchPage.selectType('Händelser')
    await searchPage.search('test')

    await searchPage.expectResults()
  })

  test('search articles', async ({ searchPage }) => {
    await searchPage.goto()
    await searchPage.selectType('Artiklar')
    await searchPage.search('test')

    await searchPage.expectResults()
  })

  test('search with default type', async ({ searchPage }) => {
    await searchPage.goto()
    await searchPage.search('test')

    await searchPage.expectResults()
  })

  test('no results for nonsense query', async ({ searchPage }) => {
    await searchPage.goto()
    await searchPage.search('zzz-nonexistent-e2e-query-12345')

    await searchPage.expectNoResults()
  })

  test('click result opens document @experimental', async ({
    searchPage,
    page
  }) => {
    await searchPage.goto()
    await searchPage.search('test')
    await searchPage.expectResults()

    const firstResult = searchPage.results.first()
    const rowText = await firstResult.innerText()
    const title = rowText.split('\n')[0].trim()

    await firstResult.click()

    // Verify the opened panel shows the clicked document's title
    await expect(
      page.getByRole('textbox').first()
    ).toContainText(title, { timeout: 10_000 })
  })
})
