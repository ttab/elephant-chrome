import type { TemplatePayload } from '..'
import type * as Y from 'yjs'

export function createPayload(document: Y.Doc, index: number): TemplatePayload | undefined {
  if (!document) return

  const ele = document.getMap('ele')
  const root = ele.get('root') as Y.Map<unknown>
  const meta = ele.get('meta') as Y.Map<Y.Array<unknown>>
  const links = ele.get('links') as Y.Map<Y.Array<unknown>>

  const assignments = meta.get('core/assignment')
  const currentAssignment = assignments?.get(index) as Y.Map<Y.Map<unknown>>
  const currentAssignmentMeta = currentAssignment?.get('meta') as Y.Map<unknown>

  const currentMeta = currentAssignmentMeta || meta

  // Get data from assignment, if available otherwise get it from root meta
  const slugline = (currentMeta.get('tt/slugline') as Y.Array<unknown>)?.toJSON() || []

  // Could be either YXMlText or string, convert to string
  const rootTitle = (currentAssignmentMeta || root)
    ?.get('title')
  const title = typeof rootTitle === 'object'
    ? (rootTitle as Y.XmlText).toJSON()
    : rootTitle as string

  // Get data from planning
  const story = links.get('core/story')?.toJSON() || []
  const newsvalue = meta.get('core/newsvalue')?.toJSON() || []

  const section = links.get('core/section')?.toJSON() || []

  return {
    title,
    meta: {
      'tt/slugline': slugline,
      'core/newsvalue': newsvalue
    },
    links: {
      'core/section': section,
      'core/story': story
    }
  }
}

