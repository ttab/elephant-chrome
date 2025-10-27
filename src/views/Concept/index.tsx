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
import { useSession } from 'next-auth/react'
import { Button } from '@ttab/elephant-ui'
import { toast } from 'sonner'
import { snapshotDocument } from '@/lib/snapshotDocument'
import type { HocuspocusProvider } from '@hocuspocus/provider'
import type { AwarenessUserData } from '@/contexts/CollaborationProvider'

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
  const [isChanged] = useYValue<boolean>('root.changed')

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
  documentId,
  asDialog
}: {
  provider: HocuspocusProvider | undefined
  synced: boolean
  user: AwarenessUserData
  documentId: string
} & ViewProps): JSX.Element => {
  const { status, data: session } = useSession()
  const [title] = useYValue<boolean>('root.title')
  const [isChanged, setChanged] = useYValue<boolean>('root.changed')
  const environmentIsSane = provider && status === 'authenticated'

  const handleChange = useCallback((value: boolean): void => {
    const root = provider?.document.getMap('ele').get('root') as Y.Map<unknown>
    const changed = root.get('changed') as boolean


    if (changed !== value) {
      root.set('changed', value)
    }
  }, [provider])

  const onSave = async (): Promise<void> => {
    if (!session) {
      toast.error('Ett fel har uppstått, ändringen kunde inte spara! Ladda om webbläsaren och försök igen')
      return
    }

    const snapshotResponse = await snapshotDocument(documentId, {
      status: 'usable'
    }, provider?.document)

    if (snapshotResponse && 'statusCode' in snapshotResponse && snapshotResponse.statusCode !== 200) {
      toast.error(`Ett fel uppstod när ändringen skulle sparas: ${snapshotResponse.statusMessage || 'Okänt fel'}`)
      return
    }

    setChanged(false)
  }

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
              className='border-[1px]'
              onChange={handleChange}
            >
            </TextBox>
            <div className='flex gap-2.5 align-end'>
              <Button
                onClick={(e) => {
                  e.preventDefault()
                  void onSave()
                }}
                disabled={!title || !environmentIsSane || !isChanged}
                className=''
              >
                Spara
              </Button>
            </div>
          </Form.Content>
        </Form.Root>
      </View.Content>
    </>
  )
}
Concept.meta = meta
