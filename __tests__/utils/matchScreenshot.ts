import { expect } from 'vitest'

/**
 * Screenshot assertion that can be skipped via SKIP_SCREENSHOTS env var.
 * This allows CI to run functional browser assertions in the main job
 * while deferring visual regression to a separate non-blocking job.
 */
export async function matchScreenshot(element: Element): Promise<void> {
  if (process.env.SKIP_SCREENSHOTS) {
    return
  }
  await expect(element).toMatchScreenshot()
}
