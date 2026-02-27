import { test, expect } from '../../fixtures'
import type { Browser, Locator, Page } from '@playwright/test'
import fs from 'node:fs'
import { AUTH_FILE, AUTH_FILE_2 } from '../../global-setup'
import { restoreDocument as _restoreDocument } from '../../helpers/api'

const BASE_URL = (
  process.env.E2E_BASE_URL || 'http://localhost:5183/elephant'
).replace(/\/?$/, '/')

function getUserB(): string {
  if (fs.existsSync(AUTH_FILE_2)) {
    return AUTH_FILE_2
  }
  console.warn(
    '[E2E] AUTH_FILE_2 not found — collaboration tests will use '
    + 'the same user in both contexts (same-user multi-tab, not '
    + 'multi-user collaboration)'
  )
  return AUTH_FILE
}

/** Open the same article in two browser contexts and return editors. */
async function openCollabSession(browser: Browser, articleId: string) {
  const contextA = await browser.newContext({
    storageState: AUTH_FILE,
    baseURL: BASE_URL
  })
  const contextB = await browser.newContext({
    storageState: getUserB(),
    baseURL: BASE_URL
  })

  const pageA = await contextA.newPage()
  const pageB = await contextB.newPage()

  await pageA.goto(`editor?id=${articleId}`)
  await pageB.goto(`editor?id=${articleId}`)

  const editorA = pageA.getByRole('textbox', { name: 'Artikelredigerare' })
  const editorB = pageB.getByRole('textbox', { name: 'Artikelredigerare' })
  await editorA.waitFor({ state: 'visible' })
  await editorB.waitFor({ state: 'visible' })

  // Allow Yjs WebSocket handshake to complete between both contexts.
  // networkidle cannot be used here because the WebSocket stays open.
  await pageA.waitForTimeout(2_000)

  return { contextA, contextB, pageA, pageB, editorA, editorB }
}

/** Move cursor to end and type, avoiding conflicts with existing content. */
async function typeAtEnd(page: Page, editor: Locator, text: string) {
  await editor.click()
  await page.keyboard.press('ControlOrMeta+End')
  await page.keyboard.press('Enter')
  await page.keyboard.insertText(text)
}

test.describe.serial('Editor — Collaboration @secondary', () => {
  const articleId = process.env.E2E_TEST_ARTICLE_ID

  test.beforeEach(() => {
    test.skip(!articleId, 'E2E_TEST_ARTICLE_ID not set')
  })

  test('ensure article is draft', async ({ editorPage }) => {
    await editorPage.ensureDraft(articleId!)
  })

  test('two users see each other editing', async ({ browser }) => {
    const { contextA, contextB, pageA, editorA, editorB }
      = await openCollabSession(browser, articleId!)

    try {
      const testText = `collab-${Date.now()}-sync`
      await typeAtEnd(pageA, editorA, testText)
      await expect(editorB).toContainText(testText, { timeout: 30_000 })
    } finally {
      await contextA.close()
      await contextB.close()
    }
  })

  test('edits sync bidirectionally', async ({ browser }) => {
    const { contextA, contextB, pageA, pageB, editorA, editorB }
      = await openCollabSession(browser, articleId!)

    try {
      // A -> B
      const textFromA = `collab-${Date.now()}-fromA`
      await typeAtEnd(pageA, editorA, textFromA)
      await expect(editorB).toContainText(textFromA, { timeout: 15_000 })

      // B -> A
      const textFromB = `collab-${Date.now()}-fromB`
      await typeAtEnd(pageB, editorB, textFromB)
      await expect(editorA).toContainText(textFromB, { timeout: 15_000 })
    } finally {
      await contextA.close()
      await contextB.close()
    }
  })

  test('disconnect and reconnect syncs', async ({ browser }) => {
    const { contextA, contextB, pageA, editorA, editorB }
      = await openCollabSession(browser, articleId!)

    try {
      // Type initial text and verify sync
      const initialText = `collab-${Date.now()}-initial`
      await typeAtEnd(pageA, editorA, initialText)
      await expect(editorB).toContainText(initialText, { timeout: 15_000 })

      // Take B offline, type more in A
      await contextB.setOffline(true)
      const offlineText = `collab-${Date.now()}-offline`
      await pageA.keyboard.insertText(offlineText)

      // Bring B back online — should catch up
      await contextB.setOffline(false)
      await expect(editorB).toContainText(offlineText, { timeout: 15_000 })
      await expect(editorB).toContainText(initialText, { timeout: 5_000 })
    } finally {
      await contextA.close()
      await contextB.close()
    }
  })
})
