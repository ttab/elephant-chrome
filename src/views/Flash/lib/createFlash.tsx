import type { HocuspocusProvider } from '@hocuspocus/provider'
import type { Session } from 'next-auth'
import { getValueByYPath } from '@/shared/yUtils'
import { convertToISOStringInTimeZone } from '@/lib/datetime'
import { toast } from 'sonner'
import { ToastAction } from '../ToastAction'
import { addAssignmentWithDeliverable } from '@/lib/index/addAssignment'

export type CreateFlashDocumentStatus = 'usable' | 'done' | undefined
export async function createFlash({
  flashProvider,
  status,
  session,
  planningId,
  timeZone,
  documentStatus
}: {
  flashProvider: HocuspocusProvider
  status: string
  session: Session
  planningId?: string
  timeZone: string
  documentStatus: CreateFlashDocumentStatus

}): Promise<void> {
  const flashEle = flashProvider.document.getMap('ele')
  const [documentId] = getValueByYPath<string>(flashEle, 'root.uuid')

  if (!flashProvider || status !== 'authenticated' || !documentId) {
    console.error(`Failed adding flash ${documentId} to a planning`)
    toast.error('Kunde inte lägga flashen till en planering', {
      action: <ToastAction flashId={documentId} />
    })
    return
  }

  console.warn('DECOMMENT THESE LINES BEFORE BEING DONE')
  // FIXME: Enable when debugged done
  //
  // Trigger the creation of the flash in the repository
  // flashProvider.sendStateless(
  //   createStateless(StatelessType.IN_PROGRESS, {
  //     state: false,
  //     status: documentStatus,
  //     id: documentId,
  //     context: {
  //       agent: 'server',
  //       accessToken: session.accessToken,
  //       user: session.user,
  //       type: 'Flash'
  //     }
  //   })
  // )

  // Create and collect all base data for the assignment
  const [flashTitle] = getValueByYPath<string>(flashEle, 'root.title')
  const dt = new Date()
  const isoDateTime = `${new Date().toISOString().split('.')[0]}Z` // Remove ms, add Z back again
  const localDate = convertToISOStringInTimeZone(dt, timeZone).slice(0, 10)
  const publishTime = new Date().toISOString()

  const updatedPlanningId = await addAssignmentWithDeliverable({
    planningId,
    type: 'flash',
    deliverableId: documentId,
    title: flashTitle || 'Ny flash',
    priority: 5,
    publicVisibility: false,
    localDate,
    isoDateTime,
    publishTime
  })

  const getLabel = (documentStatus: CreateFlashDocumentStatus): string => {
    switch (documentStatus) {
      case 'usable': {
        return 'Flash skickad'
      }
      case 'done': {
        return 'Flash godkänd'
      }
      default: {
        return 'Flash sparad'
      }
    }
  }

  if (!updatedPlanningId) {
    toast.error('Flashen har skapats. Tyvärr misslyckades det att koppla den till en planering. Kontakta support för mer hjälp.', {
      action: <ToastAction planningId={updatedPlanningId} flashId={documentId} />
    })
  } else {
    toast.success(getLabel(documentStatus), {
      action: <ToastAction planningId={updatedPlanningId} flashId={documentId} />
    })
  }

  // const [newPlanningId, newPlanning] = createDocument({
  //   template: Templates.planning,
  //   inProgress: true,
  //   payload: {
  //     meta: {
  //       'core/newsvalue': [Block.create({ type: 'core/newsvalue', value: '5' })]
  //     }
  //   }
  // })

  // Create assignment in planning
  //   const assignmentIndex = appendAssignment({
  //     document: newPlanning,
  //     title: flashTitle,
  //     type: 'flash',
  //     assignmentData: {
  //       full_day: 'false',
  //       start_date: localISODateTime,
  //       end_date: localISODateTime,
  //       start: zuluISODate,
  //       end: zuluISODate,
  //       public: 'false', // flashes should be private
  //       publish: new Date().toISOString()
  //     }
  //   })
  // }
  // If we have a selected planning, use that to create a collaboration document
  // Otherwise, create a new planning document
  // const collaborationPayload = useMemo(() => {
  //   if (!selectedPlanning?.value) {
  //     const [documentId, initialDocument] = createDocument({
  //       template: Templates.planning,
  //       inProgress: true,
  //       payload
  //     })
  //     return { documentId, initialDocument }
  //   } else {
  //     return { documentId: selectedPlanning?.value }
  //   }
  // }, [selectedPlanning, payload])

  // const { document: planning, documentId: planningId, synced } = useCollaborationDocument(collaborationPayload)
  //


  // // Append flash to assignment in planning,
  // appendDocumentToAssignment({ document: planning.document, id: documentId, index: assignmentIndex, type: 'flash' })

  // Update planning with flash details
  // const payload = createPayload(
  //   hasSelectedPlanning ? planning.document : flashProvider.document,
  //   assignmentIndex,
  //   'flash'
  // )

  // if (payload) {
  //   appendPayload(
  //     hasSelectedPlanning ? flashProvider.document : planning.document,
  //     { ...payload, title: flashTitle }
  //   )
  // }

  // // Create or update planning in repo
  // flashProvider.sendStateless(
  //   createStateless(StatelessType.IN_PROGRESS, {
  //     state: false,
  //     id: planning.id,
  //     context: {
  //       agent: 'user',
  //       accessToken: session.accessToken,
  //       user: session.user,
  //       type: 'Planning'
  //     }
  //   })
  // )
}

// function appendPayload(planning: Y.Doc, payload: TemplatePayload) {
//   const ele = planning.getMap<Y.Map<unknown>>('ele')
//   const root = ele.get('root') as Y.Map<unknown>

//   const links = ele.get('links') as Y.Map<unknown>

//   if (payload.links) {
//     Object.values(payload.links).forEach((block) => {
//       block.forEach((b) => {
//         const newYArray = new Y.Array()
//         // Clear previous data
//         links.set(b.type, newYArray)


//         const yArray = links.get(b.type) as Y.Array<unknown>
//         yArray.push([toYStructure(b)])
//       })
//     })
//   }


//   if (payload.title) {
//     root.set('title', toSlateYXmlText(payload.title))
//   }
// }
