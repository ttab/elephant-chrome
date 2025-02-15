import { addDocumentToPlanning } from '@/views/Flash/addDocumentToPlanning'
import { addAssignmentLinkToDocument } from '@/views/Flash/addAssignmentToDocument'
import { createStateless, StatelessType } from '@/shared/stateless'
import type { HocuspocusProvider } from '@hocuspocus/provider'
import type { Session } from 'next-auth'
import type { IDBAuthor } from 'src/datastore/types'
import type * as Y from 'yjs'

export function createFlash(
  documentId: string,
  title: string | undefined,
  provider: HocuspocusProvider,
  status: string,
  session: Session,
  planningDocument: Y.Doc | undefined,
  newPlanningDocument: Y.Doc | undefined,
  timeZone: string,
  author: IDBAuthor | undefined
): void {
  if (provider && status === 'authenticated') {
    // First and foremost we persist the flash, it needs an assignment
    const assignmentId = crypto.randomUUID()
    addAssignmentLinkToDocument(provider.document, assignmentId)

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

    // Next we add it to an assignment in a planning.
    try {
      const document = planningDocument || newPlanningDocument
      if (document) {
        const planningId = addDocumentToPlanning({
          document: provider.document,
          documentType: 'flash',
          planningDocument: document,
          assignmentId,
          timeZone,
          author
        })

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
      } else {
        throw new Error(`Failed adding flash ${documentId} - ${title} to a planning`)
      }
    } catch (err) {
      // We won't let errors interfere with the publishing of the flash.
      console.error(err)
    }
  }
}
