import { test, expect } from '../../fixtures'

test.describe('Latest Articles @secondary', () => {
  test('load latest articles', async ({ latestPage }) => {
    await latestPage.goto()
    await latestPage.expectArticlesVisible()
  })

  test('click article opens editor', async ({ page, latestPage }) => {
    await latestPage.goto()
    await latestPage.expectArticlesVisible()

    // Pick the first non-Flash article (Flash opens a different editor view)
    const firstArticle = latestPage.nonFlashArticles.first()
    await expect(firstArticle).toBeVisible()
    const articleText = await firstArticle.innerText()
    const title = articleText.split('\n')[0].trim()

    await firstArticle.click()

    // The article opens in an editor panel — verify by checking for the
    // "Artikel" heading and the status button, then verify the title text.
    // We avoid getByRole('textbox') because Slate removes that role from
    // published (read-only) articles.
    const editorHeading = page.getByRole('heading', { name: 'Artikel', level: 2 })
    await expect(editorHeading).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(title).last()).toBeVisible()
  })
})
