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
 */
export function attachArticleAssignment({
  planning,
  articleId,
  articleTitle,
  targetDate
}: {
  planning: Document
  articleId: string
  articleTitle: string
  targetDate: string
}): Document {
  const assignmentIso = `${targetDate}T09:00:00Z`
  // Inherit the planning's slugline onto the assignment. If the planning has
  // no slugline the Repository will reject — that's the correct failure mode,
  // since every planning is supposed to carry one.
  const slugline = planning.meta.find((m) => m.type === 'tt/slugline')?.value

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

  // The template seeds a blank core/description placeholder; Repository
  // validation rejects empty text — strip it and let it be added later via
  // the UI if needed.
  const cleanedMeta = assignment.meta.filter((block) =>
    !(block.type === 'core/description' && !block.data?.text?.trim())
  )

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
 * Does this planning own `articleId` as a deliverable via any assignment?
 */
export function planningReferencesArticle(planning: Document, articleId: string): boolean {
  return planning.meta.some((block) =>
    block.type === 'core/assignment'
    && block.links.some((link) => link.rel === 'deliverable' && link.uuid === articleId)
  )
}

