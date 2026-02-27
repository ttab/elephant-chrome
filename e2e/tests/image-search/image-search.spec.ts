import { test } from '../../fixtures'

test.describe('Image Search @secondary', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('imagesearch')
    // Wait for the page to load — either the search input or an error
    const errorHeading = page.getByRole('heading', {
      name: /fel har uppstått/i
    })
    const searchInput = page.getByPlaceholder('Sök')
    await errorHeading.or(searchInput)
      .waitFor({ state: 'visible', timeout: 10_000 })
    test.skip(
      await errorHeading.isVisible(),
      'Image search service unavailable'
    )
  })

  test('load search page', async ({ imageSearchPage }) => {
    await imageSearchPage.expectSearchVisible()
  })

  test('search for images', async ({ imageSearchPage }) => {
    await imageSearchPage.search('stockholm')
    await imageSearchPage.expectResults()
  })

  test('open preview dialog', async ({ imageSearchPage }) => {
    await imageSearchPage.search('stockholm')
    await imageSearchPage.expectResults()
    await imageSearchPage.clickThumbnail(0)
    await imageSearchPage.expectPreviewOpen()
  })

  test('close preview dialog', async ({ imageSearchPage }) => {
    await imageSearchPage.search('stockholm')
    await imageSearchPage.expectResults()
    await imageSearchPage.clickThumbnail(0)
    await imageSearchPage.expectPreviewOpen()
    await imageSearchPage.closePreview()
    await imageSearchPage.expectPreviewClosed()
  })
})
