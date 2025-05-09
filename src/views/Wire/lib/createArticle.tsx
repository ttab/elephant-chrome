import type { HocuspocusProvider } from '@hocuspocus/provider'
import * as Y from 'yjs'
import { appendDocumentToAssignment, appendAssignment } from '@/lib/createYItem'
import { createStateless, StatelessType } from '@/shared/stateless'
import type { Session } from 'next-auth'
import { createPayload } from '@/defaults/templates/lib/createPayload'
import { getValueByYPath, toSlateYXmlText, toYStructure } from '@/shared/yUtils'
import type { Wire } from '@/hooks/index/useDocuments/schemas/wire'
import type { TemplatePayload } from '@/defaults/templates'
import { toast } from 'sonner'
import { ToastAction } from '../ToastAction'

export function createArticle({
  provider,
  status,
  session,
  planning,
  wire,
  hasSelectedPlanning
}: {
  provider: HocuspocusProvider
  status: string
  session: Session
  planning: {
    document: Y.Doc | undefined
    id: string | undefined
    title?: string | undefined
  }
  wire?: Wire
  hasSelectedPlanning: boolean
}): { article: Y.Doc, planning: Y.Doc } | undefined {
  const articleEle = provider.document.getMap('ele')
  const [documentId] = getValueByYPath<string>(articleEle, 'root.uuid')

  if (provider && status === 'authenticated' && documentId) {
    try {
      if (planning.document && planning.id) {
        const [assignmentTitle] = getValueByYPath<string>(articleEle, 'root.title')
        const [assignmentSlugline] = getValueByYPath<string>(articleEle, 'meta[tt/slugline][0].value')

        // Append assignment to planning, return index of added assignment
        const assignmentIndex = appendAssignment({
          document: planning.document,
          title: assignmentTitle,
          wire,
          type: 'text',
          slugLine: assignmentSlugline
        })

        // Append information from planning to article or vice versa
        const payload = createPayload(
          hasSelectedPlanning
            ? planning.document
            : provider.document
        )

        if (payload) {
          // if article is created from planning, remove description
          if (provider.document) {
            delete payload.meta?.['core/description']
          }

          appendPayload(
            hasSelectedPlanning
              ? provider.document
              : planning.document,
            { ...payload, title: planning.title }
          )
        }

        // Append article to assignment in planning,
        appendDocumentToAssignment({ document: planning.document, id: documentId, index: assignmentIndex, type: 'article' })

        // Create or update planning in repo
        provider.sendStateless(
          createStateless(StatelessType.IN_PROGRESS, {
            state: false,
            id: planning.id,
            context: {
              agent: 'server',
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
              agent: 'server',
              accessToken: session.accessToken,
              user: session.user,
              type: 'Article'
            }
          })
        )

        toast.success(`Artikel skapad`, {
          action: <ToastAction planningId={planning.id} wireId={documentId} />
        })
        return { article: provider.document, planning: planning.document }
      } else {
        const ele = provider.document.getMap('ele')
        const root = ele.get('root') as Y.Map<unknown>
        const documentId = root.get('uuid') as string

        throw new Error(`Failed adding article (${documentId}) to planning (${planning.id})`)
      }
    } catch (err) {
      console.error(err)
    }
  }
  return undefined
}

// Goes both way, planning to article and article to planning
function appendPayload(planning: Y.Doc, payload: TemplatePayload) {
  const ele = planning.getMap<Y.Map<unknown>>('ele')
  const root = ele.get('root') as Y.Map<unknown>
  const meta = ele.get('meta') as Y.Map<unknown>
  const links = ele.get('links') as Y.Map<unknown>

  if (payload.meta) {
    Object.values(payload.meta).forEach((block) => {
      block.forEach((b) => {
        const newYArray = new Y.Array()
        // Clear previous data
        meta.set(b.type, newYArray)


        const yArray = meta.get(b.type) as Y.Array<unknown>
        yArray.push([toYStructure(b)])
      })
    })
  }


  if (payload.links) {
    Object.values(payload.links).forEach((block) => {
      block.forEach((b) => {
        const newYArray = new Y.Array()
        // Clear previous data
        links.set(b.type, newYArray)


        const yArray = links.get(b.type) as Y.Array<unknown>
        yArray.push([toYStructure(b)])
      })
    })
  }

  if (payload.title) {
    root.set('title', toSlateYXmlText(payload.title))
  }
}
