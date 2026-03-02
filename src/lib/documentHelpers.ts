import type { Block, Document } from '@ttab/elephant-api/newsdoc'
import type { DocumentMeta } from '@ttab/elephant-api/repository'
import type { DocumentState } from '@ttab/elephant-api/repositorysocket'
import type { InclusionDocument } from '@ttab/elephant-api/repositorysocket'
import { getStatusFromMeta } from './getStatusFromMeta'

/**
 * Extract assignment blocks from a planning document
 */
export function getAssignments(doc?: Document): Block[] {
  if (!doc?.meta) return []

  return doc.meta.filter(
    (block): block is Block => block.type === 'core/assignment'
  )
}

/**
 * Get deliverable UUID from assignment block links
 */
export function getDeliverableLink(assignment: Block): string | undefined {
  const deliverableLink = assignment.links?.find((link) => link.rel === 'deliverable')
  return deliverableLink?.uuid
}

/**
 * Find an included document by UUID
 */
export function findIncludedDocument(
  includes: InclusionDocument[] | undefined,
  uuid: string | undefined
): DocumentState | undefined {
  if (!includes || !uuid) return undefined

  const inclusion = includes.find((doc) => doc.uuid === uuid)
  return inclusion?.state
}

/**
 * Extract status name from document meta
 */
export function getDocumentStatus(meta?: DocumentMeta): string {
  if (!meta) return 'draft'
  return getStatusFromMeta(meta, true).name
}

/**
 * Extract section UUID from a document's links
 */
export function getSection(doc?: Document): string | undefined {
  return doc?.links.find((link) => link.type === 'core/section')?.uuid
}

/**
 * Extract section link (uuid + title) from a document's links
 */
export function getSectionLink(doc?: Document): { uuid?: string, title?: string } | undefined {
  const link = doc?.links.find((l) => l.type === 'core/section')
  if (!link) return undefined
  return { uuid: link.uuid, title: link.title }
}

/**
 * Extract newsvalue from a document's meta
 */
export function getNewsvalue(doc?: Document): string | undefined {
  return doc?.meta.find((m) => m.type === 'core/newsvalue')?.value
}

