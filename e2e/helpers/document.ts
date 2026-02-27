import { expect, type Page, type APIRequestContext } from '@playwright/test'
import { getDocument } from './api'

/**
 * Intercept the document store request to capture the saved document
 * UUID. The browser POSTs to `/api/documents/{uuid}/store` which
 * the Express server forwards to the repository via Hocuspocus.
 *
 * Call BEFORE triggering the save action. Returns the UUID extracted
 * from the JSON response body.
 */
export async function captureDocumentId(
  page: Page,
  action: () => Promise<void>
): Promise<string> {
  const responsePromise = page.waitForResponse(
    (r) => r.url().includes('/api/documents/')
      && r.url().includes('/store')
      && r.ok()
  )

  await action()

  const response = await responsePromise
  const body = await response.json() as Record<string, unknown>
  const uuid = body?.uuid

  if (typeof uuid !== 'string' || uuid.length === 0) {
    throw new Error(
      'Failed to extract document UUID from store response. '
      + `Got: ${JSON.stringify(body)}`
    )
  }

  return uuid
}

/**
 * Wait for a document store response to complete.
 * Use after triggering a save action to ensure the network
 * round-trip finishes before asserting on UI state.
 */
export function waitForDocumentSave(page: Page): Promise<void> {
  return page.waitForResponse(
    (r) => r.url().includes('/api/documents/')
      && r.url().includes('/store')
      && r.ok()
  ).then(() => undefined)
}

/**
 * Verify a document exists via the REST API and optionally check
 * that its title content matches. The title label may be split
 * across Slate text nodes (e.g. "[" and "E2E-TEST] Flash abc"),
 * so we check for the unique ID suffix rather than the full title.
 */
export async function verifyDocument(
  request: APIRequestContext,
  documentId: string,
  expectedTitle?: string
): Promise<void> {
  const doc = await getDocument(request, documentId)
  expect(doc).toBeTruthy()

  if (expectedTitle) {
    // Extract the unique ID suffix (last space-delimited token)
    // to avoid mismatches from Slate splitting "[E2E-TEST]" across
    // text nodes.
    const idSuffix = expectedTitle.split(' ').pop() ?? expectedTitle
    expect(JSON.stringify(doc)).toContain(idSuffix)
  }
}
