import { appendAssignment, appendDocumentToAssignment } from '@/lib/createYItem'
import { createStateless, StatelessType } from '@/shared/stateless'
import type { HocuspocusProvider } from '@hocuspocus/provider'
import type { Session } from 'next-auth'
import * as Y from 'yjs'
import { getValueByYPath, toSlateYXmlText, toYStructure } from '@/lib/yUtils'
import { createPayload } from '@/defaults/templates/lib/createPayload'
import type { TemplatePayload } from '@/defaults/templates'
import { convertToISOStringInTimeZone } from '@/lib/datetime'

export function createFlash({
  provider,
  status,
  session,
  planning,
  hasSelectedPlanning,
  timeZone
}: {
  provider: HocuspocusProvider
  status: string
  session: Session
  planning: {
    document: Y.Doc | undefined
    id: string | undefined
    title?: string | undefined
  }
  hasSelectedPlanning: boolean
  timeZone: string
}): { flash: Y.Doc, planning: Y.Doc } | undefined {
  const flashEle = provider.document.getMap('ele')
  const [documentId] = getValueByYPath<string>(flashEle, 'root.uuid')

  if (provider && status === 'authenticated' && documentId) {
    try {
      if (planning.document && planning.id) {
        // Create flash in repo
        provider.sendStateless(
          createStateless(StatelessType.IN_PROGRESS, {
            state: false,
            status: 'done',
            id: documentId,
            context: {
              accessToken: session.accessToken,
              user: session.user,
              type: 'Flash'
            }
          })
        )

        const [flashTitle] = getValueByYPath<string>(flashEle, 'root.title')

        const dt = new Date()
        const zuluISODate = `${new Date().toISOString().split('.')[0]}Z` // Remove ms, add Z back again
        const localISODateTime = convertToISOStringInTimeZone(dt, timeZone).slice(0, 10)

        // Create assignment in planning
        const assignmentIndex = appendAssignment({
          document: planning.document,
          title: flashTitle,
          type: 'flash',
          assignmentData: {
            full_day: 'false',
            start_date: localISODateTime,
            end_date: localISODateTime,
            start: zuluISODate,
            end: zuluISODate,
            public: 'true'
          }
        })

        // Append flash to assignment in planning,
        appendDocumentToAssignment({ document: planning.document, id: documentId, index: assignmentIndex, type: 'flash' })

        // Update planning with flash details
        const payload = createPayload(
          hasSelectedPlanning
            ? planning.document
            : provider.document,
          assignmentIndex)

        if (payload) {
          appendPayload(hasSelectedPlanning
            ? provider.document
            : planning.document,
          { ...payload, title: flashTitle }
          )
        }

        // Create or update planning in repo
        provider.sendStateless(
          createStateless(StatelessType.IN_PROGRESS, {
            state: false,
            id: planning.id,
            context: {
              accessToken: session.accessToken,
              user: session.user,
              type: 'Planning'
            }
          })
        )

        return { flash: provider.document, planning: planning.document }
      } else {
        throw new Error(`Failed adding flash ${documentId} to a planning`)
      }
    } catch (err) {
    // We won't let errors interfere with the publishing of the flash.
      console.error(err)
    }
    // TODO: User message/sonner
    return undefined
  }
}

function appendPayload(planning: Y.Doc, payload: TemplatePayload) {
  const ele = planning.getMap<Y.Map<unknown>>('ele')
  const root = ele.get('root') as Y.Map<unknown>

  const links = ele.get('links') as Y.Map<unknown>

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
