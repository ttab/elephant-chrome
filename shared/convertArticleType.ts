import { Block, Document } from '@ttab/elephant-api/newsdoc'
import type { ValidationResult } from '@ttab/elephant-api/repository'
import type { Repository } from './Repository.js'

export type ArticleType = 'core/article' | 'core/article#timeless'

export interface ArticleConversionResult {
  newDocument: Document
  sourceUuid: string
  errors: ValidationResult[]
}

// Repository rejects `tt/slugline` blocks whose value is empty. With the
// `hasLooseSlugline` feature flag the editor leaves these blocks in the source
// document, so we have to strip them before persisting anything derived from
// it.
const isEmptySlugline = (block: Block): boolean =>
  block.type === 'tt/slugline' && !block.value?.trim()

const withoutEmptySluglines = (blocks: Block[]): Block[] =>
  blocks.filter((block) => !isEmptySlugline(block))

/**
 * Prune the source document against the target type and build a new document
 * with a fresh UUID plus a rel='source' link back to the original. The caller
 * is responsible for persisting the new document and marking the source as
 * "used" atomically (see Repository.createDerivedDocument).
 */
export async function prepareArticleConversion({
  sourceDocument,
  targetType,
  repository,
  accessToken,
  extraLinks = []
}: {
  sourceDocument: Document
  targetType: ArticleType
  repository: Repository
  accessToken: string
  extraLinks?: Block[]
}): Promise<ArticleConversionResult> {
  if (sourceDocument.type === targetType) {
    throw new Error(`Document is already of type ${targetType}`)
  }

  const docWithTargetType = Document.create({
    ...sourceDocument,
    type: targetType,
    links: [...sourceDocument.links, ...extraLinks]
  })

  const { document: prunedDoc, errors } = await repository.pruneDocument(
    docWithTargetType,
    accessToken
  )

  const newUuid = crypto.randomUUID()

  return {
    newDocument: Document.create({
      ...prunedDoc,
      uuid: newUuid,
      uri: `core://article/${newUuid}`,
      meta: withoutEmptySluglines(prunedDoc.meta),
      links: [
        ...prunedDoc.links,
        Block.create({
          type: sourceDocument.type,
          uuid: sourceDocument.uuid,
          title: sourceDocument.title,
          rel: 'source-document'
        })
      ]
    }),
    sourceUuid: sourceDocument.uuid,
    errors
  }
}
