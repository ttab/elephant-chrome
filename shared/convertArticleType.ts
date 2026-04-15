import { Document } from '@ttab/elephant-api/newsdoc'
import type { ValidationResult } from '@ttab/elephant-api/repository'
import type { Repository } from './Repository.js'

export type ArticleType = 'core/article' | 'core/article#timeless'

/**
 * Convert a document between article types using the Prune API.
 * The Prune API removes invalid fields for the target type.
 */
export async function convertArticleType(
  document: Document,
  targetType: ArticleType,
  repository: Repository,
  accessToken: string
): Promise<{ document: Document, errors: ValidationResult[] }> {
  if (document.type === targetType) {
    return { document, errors: [] }
  }

  const converted = Document.create({
    ...document,
    type: targetType
  })

  return repository.pruneDocument(converted, accessToken)
}
