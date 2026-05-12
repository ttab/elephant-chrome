import type { Repository } from '@/shared/Repository'
import type { Session } from 'next-auth'
import type { Block } from '@ttab/elephant-api/newsdoc'
import { createNewTimelessArticle } from './createNewTimelessArticle'
import { addAssignmentWithDeliverable } from '@/lib/index/addAssignment'

type PlanningContext = {
  planningId?: string
  planningTitle?: string
  slugline?: string
  priority?: number
  section?: { uuid: string, title: string }
}

/**
 * Save a new timeless article and link it to a planning as an assignment with
 * deliverable. Resolves with the new document id on success; throws if either
 * step fails so the caller's error UI can surface it.
 */
export async function submitTimeless(args: {
  repository: Repository | undefined
  session: Session | null
  id: string
  title: string
  category: Block
  newsvalue: string
  slugline: string
  section: Block | undefined
  language?: string
  planningContext: PlanningContext
  localDate: string
  isoDateTime: string
  author?: { id: string, name: string }
}): Promise<string> {
  const newId = await createNewTimelessArticle({
    repository: args.repository,
    session: args.session,
    id: args.id,
    title: args.title,
    category: args.category,
    newsvalue: args.newsvalue,
    slugline: args.slugline,
    section: args.section,
    language: args.language
  })

  const planningId = await addAssignmentWithDeliverable({
    ...args.planningContext,
    type: 'timeless',
    deliverableId: newId,
    title: args.title,
    publicVisibility: false,
    localDate: args.localDate,
    isoDateTime: args.isoDateTime,
    author: args.author
  })

  if (!planningId) {
    throw new Error('Planning link failed')
  }

  return newId
}
