import { test, expect } from '../../fixtures'

test.describe('Latest Articles @secondary', () => {
  test('load latest articles', async ({ latestPage }) => {
    await latestPage.goto()
    await latestPage.expectArticlesVisible()
  })

  test('click article opens editor', async ({ page, latestPage }) => {
    await latestPage.goto()
    await latestPage.expectArticlesVisible()

    // Grab the title from the first visible text line in the card
    const firstArticle = latestPage.articles.first()
    const articleText = await firstArticle.innerText()
    const title = articleText.split('\n')[0].trim()

    await latestPage.clickArticle(0)

    const editor = page.getByRole('textbox', { name: 'Artikelredigerare' })
    await expect(editor).toBeVisible({ timeout: 10_000 })
    await expect(editor).toContainText(title)
  })
})
