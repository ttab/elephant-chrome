import { Block, Document } from '@ttab/elephant-api/newsdoc'
import type { ValidationResult } from '@ttab/elephant-api/repository'
import type { Repository } from './Repository.js'

export type ArticleType = 'core/article' | 'core/article#timeless'

export interface ArticleConversionResult {
  /** The new document to be created (with new UUID) */
  newDocument: Document
  /** The source document UUID (to be marked as "used") */
  sourceUuid: string
  /** Validation errors from pruning (warnings, not blockers) */
  errors: ValidationResult[]
}

/**
 * Prepare an article type conversion by creating a new document from the source.
 *
 * This does NOT modify the source document in-place. Instead it:
 * 1. Prunes the source document for the target type (removes invalid blocks)
 * 2. Creates a new document with a fresh UUID
 * 3. Adds a link back to the source document
 *
 * The caller is responsible for atomically:
 * - Saving the new document
 * - Setting the source document status to "used"
 */
export async function prepareArticleConversion(
  sourceDocument: Document,
  targetType: ArticleType,
  repository: Repository,
  accessToken: string
): Promise<ArticleConversionResult> {
  if (sourceDocument.type === targetType) {
    throw new Error(`Document is already of type ${targetType}`)
  }

  // Create document with target type for pruning
  const docWithTargetType = Document.create({
    ...sourceDocument,
    type: targetType
  })

  // Prune to remove invalid blocks for the target type
  const { document: prunedDoc, errors } = await repository.pruneDocument(
    docWithTargetType,
    accessToken
  )

  // Generate new UUID for the converted document
  const newUuid = crypto.randomUUID()

  // Create new document with fresh UUID and link back to source
  const newDocument = Document.create({
    ...prunedDoc,
    uuid: newUuid,
    uri: `core://article/${newUuid}`,
    links: [
      ...prunedDoc.links,
      Block.create({
        type: sourceDocument.type,
        uuid: sourceDocument.uuid,
        rel: 'source'
      })
    ]
  })

  return {
    newDocument,
    sourceUuid: sourceDocument.uuid,
    errors
  }
}
