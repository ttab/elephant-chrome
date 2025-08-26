import type * as Y from 'yjs'
import { AwarenessDocument, View } from '@/components'
import type { ViewMetadata, ViewProps } from '@/types'
import { FlashDialog } from './FlashDialog'
import { createDocument } from '@/shared/createYItem'
import { useState } from 'react'
import * as Templates from '@/shared/templates'
import { useQuery } from '@/hooks/useQuery'
import { Error } from '../Error'
import { FlashView } from './FlashView'
import { useWorkflowStatus } from '@/hooks/useWorkflowStatus'
import { FlashHeader } from './FlashHeader'
import { Editor as PlainEditor } from '@/components/PlainEditor'

const meta: ViewMetadata = {
  name: 'Flash',
  path: `${import.meta.env.BASE_URL || ''}/flash`,
  widths: {
    sm: 12,
    md: 12,
    lg: 6,
    xl: 6,
    '2xl': 6,
    hd: 6,
    fhd: 4,
    qhd: 3,
    uhd: 2
  }
}

export const Flash = (props: ViewProps & {
  document?: Y.Doc
}): JSX.Element => {
  const [query] = useQuery()
  const [document, setDocument] = useState<Y.Doc | undefined>(undefined)
  const [workflowStatus] = useWorkflowStatus(props.id || '', true)

  // We must not read query.id if we are in a dialog or we pick up other documents ids
  const [documentId, setDocumentId] = useState<string | undefined>(props.id || (props.asDialog ? undefined : query.id as string))

  // Create docment if in a dialog
  if (props.asDialog && !documentId) {
    const [docId, doc] = createDocument({
      template: Templates.flash,
      documentId: props.id || undefined,
      inProgress: props.asDialog
    })

    setDocument(doc)
    setDocumentId(docId)
  }

  // Error handling for missing document
  if (!documentId || typeof documentId !== 'string') {
    return (
      <Error
        title='Flashdokument saknas'
        message='Inget flashdokument är angivet. Navigera tillbaka till översikten och försök igen.'
      />
    )
  }

  // If published or specific version has be specified
  if (workflowStatus?.name === 'usable' || props.version || workflowStatus?.name === 'unpublished') {
    const bigIntVersion = workflowStatus?.name === 'usable'
      ? workflowStatus?.version
      : BigInt(props.version ?? 0)

    return (
      <View.Root>
        <FlashHeader documentId={documentId} readOnly />
        <PlainEditor key={props.version} id={documentId} version={bigIntVersion} />
      </View.Root>
    )
  }

  return (
    <>
      {props.asDialog
        ? (
            <AwarenessDocument documentId={documentId} document={document}>
              <FlashDialog {...{ ...props, id: documentId }} />
            </AwarenessDocument>
          )
        : (
            <AwarenessDocument documentId={documentId}>
              <FlashView {...{ ...props, id: documentId }} />
            </AwarenessDocument>
          )}
    </>
  )
}

Flash.meta = meta
