import { Block, Document } from '@ttab/elephant-api/newsdoc'
import type { ValidationResult } from '@ttab/elephant-api/repository'
import type { Repository } from './Repository.js'
import { assignmentPlanningTemplate } from './templates/assignmentPlanningTemplate.js'

export type ArticleType = 'core/article' | 'core/article#timeless'

export interface ArticleConversionResult {
  newDocument: Document
  sourceUuid: string
  errors: ValidationResult[]
}

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

/**
 * Build a fresh planning for timeless→article conversion when no source
 * planning exists. Inherits slugline, newsvalue, section, and language from
 * the timeless so the generated planning carries meaningful metadata.
 */
export function buildFallbackPlanning({
  sourceTimeless,
  targetDate,
  newUuid
}: {
  sourceTimeless: Document
  targetDate: string
  newUuid: string
}): Document {
  const slugline = sourceTimeless.meta.find((b) => b.type === 'tt/slugline')
  const newsvalue = sourceTimeless.meta.find((b) => b.type === 'core/newsvalue')
  const sectionLink = sourceTimeless.links.find(
    (l) => l.type === 'core/section' && l.rel === 'section'
  )

  const meta: Block[] = [
    Block.create({
      type: 'core/planning-item',
      data: {
        end_date: targetDate,
        tentative: 'false',
        start_date: targetDate
      }
    }),
    newsvalue ? Block.create({ ...newsvalue }) : Block.create({ type: 'core/newsvalue' }),
    slugline ? Block.create({ ...slugline }) : Block.create({ type: 'tt/slugline' }),
    Block.create({
      type: 'core/description',
      data: { text: '' },
      role: 'public'
    }),
    Block.create({
      type: 'core/description',
      data: { text: '' },
      role: 'internal'
    })
  ]

  return Document.create({
    uuid: newUuid,
    type: 'core/planning-item',
    uri: `core://newscoverage/${newUuid}`,
    title: sourceTimeless.title,
    language: sourceTimeless.language,
    meta,
    links: sectionLink ? [Block.create({ ...sectionLink })] : []
  })
}

/**
 * Clone a planning for timeless→article conversion. Assignments are dropped
 * because the caller adds exactly one new assignment pointing at the derived
 * article.
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
 * Append a `core/assignment` block to the planning that owns the article as a
 * `rel='deliverable'`. Returns a new Document proto; does not mutate.
 *
 * When `sourceAssignment` is provided, the new assignment inherits its
 * internal description so manually entered context survives conversion.
 */
export function attachArticleAssignment({
  planning,
  articleId,
  articleTitle,
  targetDate,
  sourceAssignment
}: {
  planning: Document
  articleId: string
  articleTitle: string
  targetDate: string
  sourceAssignment?: Block
}): Document {
  const assignmentIso = `${targetDate}T09:00:00Z`
  const slugline = planning.meta.find((m) => m.type === 'tt/slugline')?.value
  const inheritedInternalDescription = getInternalDescription(sourceAssignment)

  const assignment = assignmentPlanningTemplate({
    assignmentType: 'text',
    planningDate: targetDate,
    title: articleTitle,
    slugLine: slugline,
    assignee: null,
    assignmentData: {
      public: 'true',
      start: assignmentIso,
      end: assignmentIso,
      start_date: targetDate,
      end_date: targetDate
    }
  })

  // bulkUpdate bypasses stripEmptyValidatedMetaBlocks, so drop the
  // template's empty internal description and re-add it only when we
  // have text. Public descriptions and other meta blocks are left alone.
  const metaWithoutInternal = assignment.meta.filter(
    (block) => !(block.type === 'core/description' && block.role === 'internal')
  )
  const internalDescription = inheritedInternalDescription
    ? [Block.create({
        type: 'core/description',
        role: 'internal',
        data: { text: inheritedInternalDescription }
      })]
    : []
  const cleanedMeta = [...metaWithoutInternal, ...internalDescription]

  const assignmentWithDeliverable = Block.create({
    ...assignment,
    meta: cleanedMeta,
    links: [
      ...assignment.links,
      Block.create({
        type: 'core/article',
        uuid: articleId,
        rel: 'deliverable'
      })
    ]
  })

  return Document.create({
    ...planning,
    meta: [...planning.meta, assignmentWithDeliverable]
  })
}

/**
 * Find the assignment in `planning` that owns `articleId` as a deliverable.
 */
export function findArticleAssignment(planning: Document, articleId: string): Block | undefined {
  return planning.meta.find((block) =>
    block.type === 'core/assignment'
    && block.links.some((link) => link.rel === 'deliverable' && link.uuid === articleId)
  )
}

function getInternalDescription(block: Block | undefined): string | undefined {
  const text = block?.meta
    .find((m) => m.type === 'core/description' && m.role === 'internal')
    ?.data?.text?.trim()
  return text || undefined
}

