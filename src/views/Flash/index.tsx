import type * as Y from 'yjs'
import { AwarenessDocument } from '@/components'
import type { ViewMetadata, ViewProps } from '@/types'
import { FlashViewContent } from './FlashViewContent'
import { createDocument } from '@/lib/createYItem'
import { useState } from 'react'
import * as Templates from '@/defaults/templates'
import { useQuery } from '@/hooks/useQuery'
import { Error } from '../Error'

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
  const [documentId, setDocumentId] = useState<string | undefined>(props.id || query.id as string)

  // Document creation if needed
  if ((props.onDocumentCreated && !document) || !documentId) {
    const [docId, doc] = createDocument({
      template: Templates.flash,
      documentId: props.id || undefined,
      inProgress: props.asDialog
    })
    setDocument(doc)
    setDocumentId(docId)
  }

  if (document && props.onDocumentCreated) {
    props.onDocumentCreated()
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
    <AwarenessDocument documentId={documentId} document={document}>
      <FlashViewContent {...
        {
          ...props,
          id: documentId
        }
      }
      />
    </AwarenessDocument>
  )
}

Flash.meta = meta
