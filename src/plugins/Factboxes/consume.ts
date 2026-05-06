import type { TBConsumeFunction, TBElement, TBResource } from '@ttab/textbit'
import type { Block } from '@ttab/elephant-api/newsdoc'
import type { Session } from 'next-auth'
import type { Repository } from '@/shared/Repository'
import { transformFactbox } from '@/shared/transformations/newsdoc/core/factbox'

type FactboxDragPayload = {
  id: string
  title: string
  text: string
  modified?: string
  original_version?: string
  original_updated?: string
  locally_changed?: string
  created?: string
}

const EMBEDDED_ID_RE = /^(.+):embedded:(\d+)$/

const fallbackChildren = (payload: FactboxDragPayload): TBElement[] => [
  {
    id: crypto.randomUUID(),
    class: 'text',
    type: 'core/factbox/title',
    children: [{ text: payload.title }]
  },
  {
    id: crypto.randomUUID(),
    class: 'block',
    type: 'core/factbox/body',
    children: payload.text.split('\n').map((t) => ({
      id: crypto.randomUUID(),
      type: 'core/text',
      class: 'text',
      children: [{ text: t }]
    }))
  }
]

/**
 * Returns the core/factbox Block for a dragged factbox, either the full
 * document (standalone factboxes) or the nth core/factbox block inside
 * an article (embedded factboxes). Returns undefined if anything fails.
 */
const fetchFactboxBlock = async (
  payload: FactboxDragPayload,
  repository: Repository,
  accessToken: string
): Promise<Block | undefined> => {
  const embedded = EMBEDDED_ID_RE.exec(payload.id)

  if (embedded) {
    const [, articleId, indexStr] = embedded
    const response = await repository
      .getDocument({ uuid: articleId, accessToken })
      .catch(() => undefined)

    const block = response?.document?.content
      .filter((b) => b.type === 'core/factbox')[parseInt(indexStr)]

    return block
  }

  const response = await repository
    .getDocument({ uuid: payload.id, accessToken })
    .catch(() => undefined)

  if (!response?.document) return undefined

  const { document } = response
  return {
    id: document.uuid,
    uuid: document.uuid,
    uri: document.uri,
    url: document.url,
    type: document.type,
    title: document.title,
    data: {},
    content: document.content,
    meta: document.meta,
    links: document.links,
    contenttype: '',
    name: '',
    rel: '',
    role: '',
    value: '',
    sensitivity: ''
  } as Block
}

export const createFactboxConsume = (
  repository: Repository | undefined,
  session: Session | null
): TBConsumeFunction => async ({ input }) => {
  if (Array.isArray(input)) {
    throw new Error('Factbox plugin expected string for consumation, not a list/array')
  }

  if (typeof input.data !== 'string') {
    throw new Error('Factbox plugin expected string for consumation')
  }

  const payload = JSON.parse(input.data) as FactboxDragPayload

  let children: TBElement[] | undefined

  if (repository && session?.accessToken) {
    const block = await fetchFactboxBlock(payload, repository, session.accessToken)
    if (block) {
      const transformed = transformFactbox(block)
      children = transformed.children as TBElement[]
    }
  }

  if (!children) {
    children = fallbackChildren(payload)
  }

  const resource: TBResource = {
    ...input,
    data: {
      id: crypto.randomUUID(),
      class: 'block',
      type: 'core/factbox',
      properties: {
        title: payload.title,
        text: payload.text,
        modified: payload.modified,
        id: payload.id,
        original_id: payload.id,
        original_updated: payload.original_updated,
        original_version: payload.original_version,
        locally_changed: payload.locally_changed,
        created: payload.created,
        rel: 'factbox',
        type: 'core/factbox'
      },
      children
    }
  }

  return resource
}
