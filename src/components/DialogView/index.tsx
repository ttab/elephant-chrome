import { createDocument } from '@/lib/createYItem'
import type { Dispatch, SetStateAction } from 'react'
import { useMemo, useState } from 'react'
import * as Views from '@/views'
import type { DefaultValueOption, View } from '@/types'
import * as Templates from '@/defaults/templates'
import { type Document } from '@ttab/elephant-api/newsdoc'
import { useCollaborationDocument } from '@/hooks/useCollaborationDocument'
import type * as Y from 'yjs'

export interface DialogViewCreate {
  setSelectedPlanning?: Dispatch<SetStateAction<DefaultValueOption | undefined>>
  selectedPlanning?: DefaultValueOption | undefined
  planningDocument?: Y.Doc
  planningId?: string
}

/**
 * Generic component to render a document view in a dialog
 */
export const DialogView = ({ view, onDialogClose }: {
  view: View
  onDialogClose?: () => void
}): JSX.Element => {
  const [selectedPlanning, setSelectedPlanning] = useState<DefaultValueOption | undefined>(undefined)

  const DocumentView = view && Views[view]

  // Document to create, f.ex. article or flash
  const initialDocument = useMemo(() => {
    return createDocument({
      template: getTemplate(view),
      inProgress: true
    })
  }, [view])

  const [newPlanningId, newPlanningYDoc] = useMemo(() => {
    return createDocument({
      template: Templates.planning,
      inProgress: true,
      payload: { newsvalue: '4' }
    })
  }, [])

  // New and empty planning document for when creating new document and planning
  const { document: newPlanningDocument } = useCollaborationDocument({
    documentId: newPlanningId,
    initialDocument: newPlanningYDoc
  })

  // Existing planning document for when adding document to existing
  const { document: existingPlanningDocument } = useCollaborationDocument({
    documentId: selectedPlanning?.value
  })

  const { document } = useCollaborationDocument({
    documentId: initialDocument[0],
    initialDocument: initialDocument[1]
  })

  if (!document) {
    return <></>
  }

  const planningDocument = existingPlanningDocument || newPlanningDocument
  const planningId = planningDocument
    ?.getMap<Y.Map<unknown>>('ele')
    ?.get('root')
    ?.get('uuid') as string

  return (
    <DocumentView
      id={initialDocument[0]}
      document={document}
      className='p-0 rounded-md'
      asDialog={true}
      onDialogClose={onDialogClose}
      setSelectedPlanning={setSelectedPlanning}
      selectedPlanning={selectedPlanning}
      planningDocument={planningDocument}
      planningId={planningId}
    />
  )
}

function getTemplate(type: View): (id: string) => Document {
  switch (type) {
    case 'Planning':
      return Templates.planning

    case 'Flash':
      return Templates.flash

    case 'Event':
      return Templates.event

    case 'Wire':
      return Templates.article

    default:
      throw new Error(`No template for ${type}`)
  }
}
