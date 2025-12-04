import type * as Y from 'yjs'
import { View } from '@/components'
import type { ViewMetadata, ViewProps } from '@/types'
import { FlashDialog } from './FlashDialog'
import { type JSX, useMemo, useRef } from 'react'
import { useQuery } from '@/hooks/useQuery'
import { Error } from '../Error'
import { FlashView } from './FlashView'
import { useWorkflowStatus } from '@/hooks/useWorkflowStatus'
import { FlashHeader } from './FlashHeader'
import { Editor as PlainEditor } from '@/components/PlainEditor'
import { getTemplateFromView } from '@/shared/templates/lib/getTemplateFromView'
import { toGroupedNewsDoc } from '@/shared/transformations/groupedNewsDoc'
import type { YDocument } from '@/modules/yjs/hooks'
import type { Document } from '@ttab/elephant-api/newsdoc'

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
  document?: Document
}): JSX.Element => {
  const [query] = useQuery()
  const [workflowStatus] = useWorkflowStatus({ documentId: props.id || '', isWorkflow: true })

  const persistentDocumentId = useRef<string>('')
  if (!persistentDocumentId.current) {
    persistentDocumentId.current = crypto.randomUUID()
  }

  // We must not read query.id if we are in a dialog or we pick up other documents ids
  const documentId = props.id || (!props.asDialog && query.id) || persistentDocumentId.current

  const data = useMemo(() => {
    if (!documentId || typeof documentId !== 'string') {
      return undefined
    }

    return toGroupedNewsDoc({
      version: 0n,
      isMetaDocument: false,
      mainDocument: '',
      document: props.document || getTemplateFromView('Flash')(documentId)
    })
  }, [documentId, props.document])

  // Error handling for missing document
  if ((!props.asDialog && !documentId) || typeof documentId !== 'string') {
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
        <FlashHeader
          ydoc={{ id: documentId } as YDocument<Y.Map<unknown>>}
          readOnly
        />
        <PlainEditor key={props.version} id={documentId} version={bigIntVersion} />
      </View.Root>
    )
  }

  return (
    <>
      {props.asDialog
        ? (
            <FlashDialog
              {...props}
              documentId={documentId}
              data={data}
            />
          )
        : (
            <FlashView {...{ ...props, documentId, data }} />
          )}
    </>
  )
}

Flash.meta = meta
