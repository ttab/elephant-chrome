import type { NavigationState, ViewMetadata, ViewProps } from '@/types/index'

import type * as Y from 'yjs'
import { useQuery } from '@/hooks/useQuery'
import { AwarenessDocument } from '@/components/AwarenessDocument'
import { Error } from '../Error'
import { useCollaboration } from '@/hooks/useCollaboration'
import { useAwareness } from '@/hooks/useAwareness'
import { useYValue } from '@/hooks/useYValue'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useState } from 'react'
import { snapshotDocument } from '@/lib/snapshotDocument'
import { toast } from 'sonner'
import { View } from '@/components/View'
import { ConceptHeader } from '../Concepts/components/ConceptHeader'
import { InfoIcon } from '@ttab/elephant-ui/icons'
import { Button } from '@ttab/elephant-ui'
import { Form } from '@/components/Form'
import { TextBox } from '@/components/ui'
import { Validation } from '@/components/Validation'
import { Title } from '@/components/Title'
import type { HistoryInterface } from '@/navigation/hooks/useHistory'
import { useView } from '@/hooks/useView'
import { useHistory, useNavigation } from '@/hooks/index'
import { Prompt } from '@/components/Prompt'

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
              <SectionContent {...props} documentId={documentId} />
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

const SectionContent = ({
  documentId,
  onDialogClose,
  asDialog,
  className
}: {
  documentId: string
} & ViewProps): JSX.Element => {
  const { provider, synced, user } = useCollaboration()
  const [, setIsFocused] = useAwareness(documentId)
  const [isChanged] = useYValue<boolean>('root.changed')
  const { status, data: session } = useSession()
  const [, setChanged] = useYValue<boolean>('root.changed')
  const environmentIsSane = provider && status === 'authenticated'
  const [showVerifyDialog, setShowVerifyDialog] = useState(false)
  const { viewId } = useView()
  const { state } = useNavigation()
  const history = useHistory()
  console.log(onDialogClose)
  useEffect(() => {
    provider?.setAwarenessField('data', user)
    setIsFocused(true)

    return () => {
      setIsFocused(false)
    }
  }, [provider, user])

  const handleChange = useCallback((value: boolean): void => {
    const root = provider?.document.getMap('ele').get('root') as Y.Map<unknown>
    const changed = root.get('changed') as boolean
    if (changed !== value) {
      root.set('changed', value)
    }
  }, [provider])

  const handleSubmit = (): void => {
    console.log('submitting')
    if (environmentIsSane) {
      void snapshotDocument(documentId, { status: 'usable', addToHistory: true }).then((response) => {
        if (response?.statusMessage) {
          toast.error('Kunde inte skapa ny sektion!', {
            duration: 5000,
            position: 'top-center'
          })
          return
        }

        // TODO should add mutate to add it to show in the list directly
        if (onDialogClose) {
          onDialogClose()
        }
      })
    }
  }


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

  const close = onDialogClose || (() => {
    handleClose(viewId, state, history)
  })

  const handleCancel = () => {
    if (isChanged) {
      setShowVerifyDialog(true)
      console.log(isChanged)
    } else {
      if (onDialogClose) {
        close()
      }
    }
  }

  return (
    <>
      <View.Root asDialog={asDialog} className={className}>
        <ConceptHeader
          documentId={documentId}
          asDialog={!!asDialog}
          isChanged={isChanged}
          onDialogClose={onDialogClose}
          type='Sektion'
        />
        {!!provider && synced
          ? (
              <View.Content className='flex flex-col max-w-[1000px] p-5'>
                <Form.Root
                  asDialog={asDialog}
                  onChange={handleChange}
                >
                  <Form.Content>
                    <Form.Title>
                      <Title
                        placeholder='Sektionsnamn'
                        autoFocus={true}
                      />
                    </Form.Title>
                    <Validation
                      path='meta.core/section[0].data.code'
                      label='code'
                      block='meta.core/section[0].data.code'
                    >
                      <TextBox
                        singleLine={true}
                        path='meta.core/section[0].data.code'
                        className='border-[1px]'
                        placeholder='Kod'
                      >
                      </TextBox>
                    </Validation>


                    {!asDialog
                      && (
                        <div className='flex gap-2.5 align-end'>
                          <Button
                            onClick={(e) => {
                              e.preventDefault()
                              void onSave()
                            }}
                            disabled={!environmentIsSane}
                            className=''
                          >
                            Spara
                          </Button>
                        </div>
                      )}

                  </Form.Content>
                  <Form.Footer>
                    <Form.Submit
                      onSubmit={() => handleSubmit()}
                      onReset={handleCancel}
                      className='w-full flex gap-2 justify-end'
                    >
                      <Button
                        type='reset'
                        className='whitespace-nowrap'
                        variant='secondary'
                        disabled={!environmentIsSane}
                      >
                        Avbryt
                      </Button>

                      <Button
                        type='submit'
                        disabled={!environmentIsSane}
                        className='whitespace-nowrap'
                      >
                        Skapa Sektion
                      </Button>
                    </Form.Submit>
                    {asDialog
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

                        </>
                      )}
                  </Form.Footer>
                </Form.Root>
              </View.Content>
            )
          : <></>}
        {showVerifyDialog && (
          <Prompt
            title='Du har osparade ändringar'
            description='Är du säker på att du vill stänga utan att spara?'
            onPrimary={() => close()}
            primaryLabel='Ja'
            onSecondary={() => setShowVerifyDialog(false)}
            secondaryLabel='Nej'
          />
        )}
      </View.Root>
    </>
  )
}

function handleClose(
  viewId: string,
  state: NavigationState,
  history: HistoryInterface
): void {
  const content = history.state?.contentState || []
  const indexToRemove = content.findIndex((obj) => obj.viewId === viewId)

  if (content.length === 1 || indexToRemove === -1) {
    console.warn('Tried to close unknown view or the last view visible, ignoring.')
    return
  }

  // If the active view is not removed we want the active view to stay active
  const preserveActiveId = state.active !== viewId

  // If it is the last view being removed, simply go back one step in the history
  if (indexToRemove === content.length - 1) {
    history.go(-1)
    return
  }

  // Split views into before/after the view to remove
  const beforeRemoved = content.slice(0, indexToRemove)
  const afterRemoved = content.slice(indexToRemove + 1)

  // If it is the first view being removed, hide it and push new history item.
  // This way the user can navigate back to the previous state.
  if (indexToRemove === 0) {
    const view = afterRemoved[0]
    history.pushState(view.path, {
      viewId: preserveActiveId ? viewId : view.viewId,
      contentState: afterRemoved
    })
    return
  }

  // When the full backwards navigation finish, add history items back one by one
  window.addEventListener('popstate', () => {
    const newContent = [...beforeRemoved]

    for (const view of afterRemoved) {
      newContent.push(view)
      const activeViewId = (preserveActiveId && newContent.findIndex((v) => v.viewId === state.active) === -1)

      history.pushState(view.path, {
        viewId: activeViewId ? viewId : view.viewId,
        contentState: newContent
      })
    }
  }, { once: true })

  // Trigger backwards navigation to just before
  // the removed item was added originally.
  history.go(-(afterRemoved.length + 1))
}

Section.meta = meta
