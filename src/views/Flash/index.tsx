import type * as Y from 'yjs'
import { AwarenessDocument } from '@/components'
import type { ViewMetadata, ViewProps } from '@/types'
import { FlashDialog } from './FlashDialog'
import { createDocument } from '@/lib/createYItem'
import { useState } from 'react'
import * as Templates from '@/defaults/templates'
import { useQuery } from '@/hooks/useQuery'
import { Error } from '../Error'
import { FlashView } from './FlashView'

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
  console.log(' :31 ~ props', props)
  const [query] = useQuery()
  const [document, setDocument] = useState<Y.Doc | undefined>(undefined)

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
