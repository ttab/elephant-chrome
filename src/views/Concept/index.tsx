// Todo specify Conceptfiles for each Concept

import { AwarenessDocument } from '@/components/AwarenessDocument'
import { useQuery } from '@/hooks/useQuery'
import type { ViewMetadata, ViewProps } from '@/types/index'
import type * as Y from 'yjs'
import { Error } from '../Error'
import { useCollaboration } from '@/hooks/useCollaboration'
import { useAwareness } from '@/hooks/useAwareness'
import { useCallback, useEffect } from 'react'
import { View } from '@/components/View'
import { useYValue } from '@/hooks/useYValue'
import { ConceptHeader } from './ConceptHeader'
import { Form } from '@/components/Form'
import { TextBox } from '@/components/ui'
import type { HocuspocusProvider } from '@hocuspocus/provider'
import type { AwarenessUserData } from '@/contexts/CollaborationProvider'
import { useWorkflowStatus } from '@/hooks/useWorkflowStatus'

const meta: ViewMetadata = {
  name: 'Concept',
  path: `${import.meta.env.BASE_URL}/concept`,
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

export const Concept = (props: ViewProps & { document?: Y.Doc }): JSX.Element => {
  const [query] = useQuery()
  const documentId = props.id || query.id

  if (!documentId) {
    return <></>
  }

  return (
    <>
      {typeof documentId === 'string'
        ? (
            <AwarenessDocument documentId={documentId} document={props.document}>
              <ConceptWrapper {...props} documentId={documentId} />
            </AwarenessDocument>
          )
        : (
            <Error
              title='Dokument saknas'
              message='Inget dokument att redigera är angivet. Navigera tillbaka till översikten och försök igen.'
            />
          )}
    </>
  )
}

const ConceptWrapper = (props: ViewProps & { documentId: string }): JSX.Element => {
  const { provider, synced, user } = useCollaboration()
  const [, setIsFocused] = useAwareness(props.documentId)
  const [isChanged, setChanged] = useYValue<boolean>('root.changed')

  useEffect(() => {
    provider?.setAwarenessField('data', user)
    setIsFocused(true)

    return () => {
      setIsFocused(false)
    }
  }, [provider, user])

  return (
    <>
      <View.Root asDialog={props?.asDialog} className={props?.className}>
        <ConceptHeader
          documentId={props.documentId}
          asDialog={!!props.asDialog}
          isChanged={isChanged}
          onDialogClose={props.onDialogClose}
          setChanged={setChanged}
        />
        {!!provider && synced
          ? (
              <ConceptContent
                {...props}
                documentId={props.documentId}
                provider={provider}
                synced={synced}
                user={user}
              />
            )
          : <></>}
      </View.Root>
    </>
  )
}

const ConceptContent = ({
  provider,
  asDialog,
  documentId
}: {
  provider: HocuspocusProvider | undefined
  synced: boolean
  user: AwarenessUserData
  documentId: string
} & ViewProps): JSX.Element => {
  const [documentStatus] = useWorkflowStatus(documentId, true)
  const isActive = documentStatus && documentStatus.name === 'usable'
  const handleChange = useCallback((value: boolean): void => {
    const root = provider?.document.getMap('ele').get('root') as Y.Map<unknown>
    const changed = root.get('changed') as boolean

    if (changed !== value) {
      root.set('changed', value)
    }
  }, [provider])

  return (
    <>
      <View.Content className='flex flex-col max-w-[1000px] p-5'>
        <Form.Root
          asDialog={asDialog}
          onChange={handleChange}
        >
          <Form.Content>
            <TextBox
              singleLine={true}
              path='root.title'
              className={isActive ? 'border-[1px]' : ''}
              onChange={handleChange}
              disabled={!isActive}
            >
            </TextBox>
          </Form.Content>
        </Form.Root>
      </View.Content>
    </>
  )
}
Concept.meta = meta
