import type { Repository } from '@/shared/Repository'
import {
  timeless as timelessTemplate,
  planning as planningTemplate
} from '@/shared/templates'
import { assignmentPlanningTemplate } from '@/shared/templates/assignmentPlanningTemplate'
import type { Session } from 'next-auth'
import { Block, Document } from '@ttab/elephant-api/newsdoc'
import { format } from 'date-fns'

/**
 * Build a planning document that owns a single `core/assignment` pointing at
 * the newly-created timeless article as a deliverable. The overview's "Open
 * original planning" action (via `useDeliverableInfo`) relies on this link
 * existing, so every timeless article created from the header needs a
 * matching planning saved alongside it.
 */
function buildPlanningForTimeless({
  planningId,
  timelessId,
  title,
  newsvalue
}: {
  planningId: string
  timelessId: string
  title: string
  newsvalue: string
}): Document {
  const today = format(new Date(), 'yyyy-MM-dd')
  const slugline = title.toLowerCase().split(/\s+/).slice(0, 3).join('-').slice(0, 20)

  const assignment = assignmentPlanningTemplate({
    assignmentType: 'timeless',
    planningDate: today,
    title,
    slugLine: slugline,
    assignee: null
  })

  const assignmentWithDeliverable = Block.create({
    ...assignment,
    links: [
      ...assignment.links,
      Block.create({
        type: 'core/article',
        uuid: timelessId,
        rel: 'deliverable'
      })
    ]
  })

  const base = planningTemplate(planningId, {
    title,
    meta: {
      'core/newsvalue': [Block.create({ type: 'core/newsvalue', value: newsvalue })],
      'tt/slugline': [Block.create({ type: 'tt/slugline', value: slugline })]
    }
  })

  return Document.create({
    ...base,
    meta: [...base.meta, assignmentWithDeliverable]
  })
}

export async function createNewTimelessArticle(
  repository: Repository | undefined,
  session: Session | null,
  id: string,
  title: string,
  category: Block,
  newsvalue: string
): Promise<string> {
  if (!session || !session.accessToken || !repository) {
    console.error('CreateTimelessArticle: Missing required dependencies', {
      hasAccessToken: !!session?.accessToken,
      hasRepository: !!repository
    })
    throw new Error('Cannot create timeless article')
  }

  try {
    const timeless = timelessTemplate(id, {
      title,
      meta: {
        'core/newsvalue': [Block.create({ type: 'core/newsvalue', value: newsvalue })]
      },
      links: { 'core/timeless-category': [category] }
    })
    const planning = buildPlanningForTimeless({
      planningId: crypto.randomUUID(),
      timelessId: id,
      title,
      newsvalue
    })
    await repository.createDocumentPair({
      documents: [timeless, planning],
      accessToken: session.accessToken
    })
    return id
  } catch (error) {
    throw new Error('Cannot create timeless article', { cause: error instanceof Error ? error : undefined })
  }
}
