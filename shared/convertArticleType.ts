import { Block, Document } from '@ttab/elephant-api/newsdoc'
import type { ValidationResult } from '@ttab/elephant-api/repository'
import type { Repository } from './Repository.js'
import { planningDocumentTemplate } from './templates/planningDocumentTemplate.js'

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
 * Prune the source document against the target type and build a new document
 * with a fresh UUID plus a rel='source' link back to the original. The caller
 * is responsible for persisting the new document and marking the source as
 * "used" atomically (see Repository.createDerivedDocument).
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

  const docWithTargetType = Document.create({
    ...sourceDocument,
    type: targetType
  })

  const { document: prunedDoc, errors } = await repository.pruneDocument(
    docWithTargetType,
    accessToken
  )

  const newUuid = crypto.randomUUID()

  const newDocument = Document.create({
    ...prunedDoc,
    uuid: newUuid,
    uri: `core://article/${newUuid}`,
    links: [
      ...prunedDoc.links,
      Block.create({
        type: 'core/article',
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

/**
 * Clone a planning for timeless→article conversion. Assignments are dropped
 * because the caller adds exactly one new assignment pointing at the derived
 * article. The planning schema currently has no allowed rel for a back-link
 * to the source planning, so the clone is not persistently linked — the
 * trace runs article→source timeless→original planning instead.
 */
export function deriveNewPlanning({
  sourcePlanning,
  targetDate,
  newUuid
}: {
  sourcePlanning: Document
  targetDate: string
  newUuid: string
}): Document {
  const updatedMeta = sourcePlanning.meta
    .filter((block) => block.type !== 'core/assignment')
    .map((block) => {
      if (block.type !== 'core/planning-item') {
        return block
      }
      return Block.create({
        ...block,
        data: { ...block.data, start_date: targetDate, end_date: targetDate }
      })
    })

  return Document.create({
    ...sourcePlanning,
    uuid: newUuid,
    uri: `core://newscoverage/${newUuid}`,
    meta: updatedMeta,
    links: [...sourcePlanning.links]
  })
}

/**
 * Build a blank planning for timeless→article conversion when the timeless
 * article has no associated planning to derive from. Seeds `core/newsvalue`
 * with `"3"` because the planning schema requires exactly one newsvalue with
 * an integer-parseable `value`, and the default template leaves it empty.
 */
export function buildFallbackPlanning({
  newUuid,
  title,
  targetDate
}: {
  newUuid: string
  title?: string
  targetDate: string
}): Document {
  return planningDocumentTemplate(newUuid, {
    title,
    query: { from: targetDate },
    meta: {
      'core/newsvalue': [Block.create({ type: 'core/newsvalue', value: '3' })]
    }
  })
}
