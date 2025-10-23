import type { ViewMetadata, ViewProps } from '@/types/index'

import type * as Y from 'yjs'
import { useQuery } from '@/hooks/useQuery'
import { AwarenessDocument } from '@/components/AwarenessDocument'
import { Error } from '../Error'
import { useCollaboration } from '@/hooks/useCollaboration'
import { useAwareness } from '@/hooks/useAwareness'
import { useYValue } from '@/hooks/useYValue'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect } from 'react'
import { snapshotDocument } from '@/lib/snapshotDocument'
import { toast } from 'sonner'
import { View } from '@/components/View'
import { ConceptHeader } from '../Concepts/components/ConceptHeader'
import { InfoIcon } from '@ttab/elephant-ui/icons'
import { Button } from '@ttab/elephant-ui'
import type { HocuspocusProvider } from '@hocuspocus/provider'
import type { AwarenessUserData } from '@/contexts/CollaborationProvider'
import { Form } from '@/components/Form'
import { TextBox } from '@/components/ui'


const meta: ViewMetadata = {
  name: 'Section',
  path: `${import.meta.env.BASE_URL}/section`,
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
export const Section = (props: ViewProps & { document?: Y.Doc }): JSX.Element => {
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
              <SectionWrapper {...props} documentId={documentId} />
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

const SectionWrapper = (props: ViewProps & { documentId: string }): JSX.Element => {
  const { provider, synced, user } = useCollaboration()
  const [, setIsFocused] = useAwareness(props.documentId)
  const [isChanged] = useYValue<boolean>('root.changed')
  const [title] = useYValue<boolean>('root.title')
  const { status } = useSession()

  useEffect(() => {
    provider?.setAwarenessField('data', user)
    setIsFocused(true)

    return () => {
      setIsFocused(false)
    }
  }, [provider, user])

  const environmentIsSane = provider && status === 'authenticated'

  const handleSubmit = (): void => {
    if (environmentIsSane) {
      void snapshotDocument(props.documentId).then((response) => {
        if (response?.statusMessage) {
          toast.error('Kunde inte skapa ny sektion!', {
            duration: 5000,
            position: 'top-center'
          })
          return
        }

        if (props.onDialogClose) {
          props.onDialogClose(props.documentId, 'title')
        }
      })
    }
  }

  return (
    <>
      <View.Root asDialog={props?.asDialog} className={props?.className}>
        <ConceptHeader
          documentId={props.documentId}
          asDialog={!!props.asDialog}
          isChanged={isChanged}
          onDialogClose={props.onDialogClose}
          type='Sektion'
        />
        {!!provider && synced
          ? (
              <SectionContent
                {...props}
                documentId={props.documentId}
                provider={provider}
                synced={synced}
                user={user}
              />
            )
          : <></>}
        <View.Footer className='justify-center'>
          {props.asDialog
            && (
              <>
                {!environmentIsSane && (
                  <div className='text-sm leading-tight pb-2 text-left flex gap-2'>
                    <span className='w-4'>
                      <InfoIcon size={18} strokeWidth={1.75} className='text-muted-foreground' />
                    </span>
                    <p>
                      Du är utloggad eller har tappat kontakt med systemet.
                      Vänligen försök logga in igen.
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={!title || !environmentIsSane}
                  className='whitespace-nowrap'
                >
                  Skapa Sektion
                </Button>
              </>
            )}
        </View.Footer>
      </View.Root>
    </>
  )
}

const SectionContent = ({
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
              placeholder='Titel'
            >
            </TextBox>
            <TextBox
              singleLine={true}
              path='meta.core/section[0].data.code'
              className='border-[1px]'
              onChange={handleChange}
              placeholder='Kod'
            >
            </TextBox>
            {!asDialog
              && (
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
              )}
          </Form.Content>
        </Form.Root>
      </View.Content>
    </>
  )
}
Section.meta = meta
