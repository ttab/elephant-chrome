import type { HocuspocusProvider } from '@hocuspocus/provider'
import * as Y from 'yjs'
import { appendArticle, appendAssignment } from '@/lib/createYItem'
import { createStateless, StatelessType } from '@/shared/stateless'
import type { Session } from 'next-auth'
import type { ArticlePayload } from '@/defaults/templates/articleDocumentTemplate'
import { createArticlePayload } from '@/defaults/templates/articleDocumentTemplate'
import { toYStructure } from '@/lib/yUtils'

export function createArticle({
  documentId,
  document,
  title,
  provider,
  status,
  session,
  planningDocument,
  planningId
}: {
  documentId: string
  document: Y.Doc
  title: string | undefined
  provider: HocuspocusProvider
  status: string
  session: Session
  planningDocument: Y.Doc | undefined
  planningId: string | undefined
}): { article: Y.Doc, planning: Y.Doc } | undefined {
  if (provider && status === 'authenticated') {
    try {
      if (planningDocument && planningId) {
        // Append assignment to planning, return index of added assignment
        const assignmentIndex = appendAssignment({ document: planningDocument })

        // Append information from planning to article
        const payload = createArticlePayload(planningDocument, assignmentIndex)
        if (payload) {
          appendPayloadToArticle(document, payload)
        }

        // Append article to assignment in planning,
        // TODO: Add title when we have it
        appendArticle({ document: planningDocument, id: documentId, index: assignmentIndex })

        // Create or update planning in repo
        provider.sendStateless(
          createStateless(StatelessType.IN_PROGRESS, {
            state: false,
            id: planningId,
            context: {
              accessToken: session.accessToken,
              user: session.user,
              type: 'Planning'
            }
          })
        )

        // Create article in repo
        provider.sendStateless(
          createStateless(StatelessType.IN_PROGRESS, {
            state: false,
            id: documentId,
            context: {
              accessToken: session.accessToken,
              user: session.user,
              type: 'Article'
            }
          })
        )

        // Returning for tests
        return { article: document, planning: planningDocument }
      } else {
        throw new Error(`Failed adding article ${documentId} - ${title} to a planning`)
      }
    } catch (err) {
      // We won't let errors interfere with the publishing of the flash.
      console.error(err)
    }
  }
  return undefined
}

// Warning: only appends the payload, may cause duplicates
function appendPayloadToArticle(article: Y.Doc, payload: ArticlePayload) {
  const ele = article.getMap<Y.Map<unknown>>('ele')
  const meta = ele.get('meta') as Y.Map<unknown>
  const links = ele.get('links') as Y.Map<unknown>

  payload.meta.forEach((block) => {
    if (!meta.has(block.type)) {
      const newYArray = new Y.Array()
      meta.set(block.type, newYArray)
    }

    (meta.get(block.type) as Y.Array<unknown>).push([toYStructure(block)])
  })


  payload.links.forEach((block) => {
    if (!links.has(block.type)) {
      const newYArray = new Y.Array()
      links.set(block.type, newYArray)
    }

    (links.get(block.type) as Y.Array<unknown>).push([toYStructure(block)])
  })
}
