import type { FullConfig } from '@playwright/test'
import { restoreDocument } from './helpers/api'

async function globalTeardown(config: FullConfig) {
  const baseURL = config.projects[0]?.use.baseURL
  const articleId = process.env.E2E_TEST_ARTICLE_ID
  const version = process.env.E2E_TEST_ARTICLE_RESTORE_VERSION

  if (!baseURL || !articleId || !version) {
    return
  }

  await restoreDocument(baseURL, articleId, Number(version))
}

export default globalTeardown
