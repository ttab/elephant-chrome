import type { ViewMetadata, ViewProps } from '@/types/index'
import type * as Y from 'yjs'
import { useQuery } from '@/hooks/useQuery'
import { AwarenessDocument } from '@/components/AwarenessDocument'
import { Error } from '../Error'
import { useCollaboration } from '@/hooks/useCollaboration'
import { useAwareness } from '@/hooks/useAwareness'
import { useYValue } from '@/hooks/useYValue'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { snapshotDocument } from '@/lib/snapshotDocument'
import { toast } from 'sonner'
import { View } from '@/components/View'
import { ConceptHeader } from '../Concepts/components/ConceptHeader'
import { InfoIcon } from '@ttab/elephant-ui/icons'
import { Button } from '@ttab/elephant-ui'
import { Form } from '@/components/Form'
import { Prompt } from '@/components/Prompt'
import { useWorkflowStatus } from '@/hooks/useWorkflowStatus'
import { useConcepts } from '../Concepts/lib/useConcepts'
import type { ConceptTableDataKey } from '../Concepts/lib/conceptDataTable'
import { LoadingText } from '@/components/LoadingText'
import { Block } from '@ttab/elephant-api/newsdoc'
import { setValueByYPath, toYStructure } from '@/shared/yUtils'

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

  if (!documentId || !props.documentType) {
    return <></>
  }
  return (
    <>
      {typeof documentId === 'string'
        ? (
            <AwarenessDocument documentId={documentId} document={props.document}>
              <ConceptContent {...props} documentId={documentId} />
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
const ConceptContent = ({
  documentId,
  onDialogClose,
  asDialog,
  className,
  documentType
}: {
  documentId: string
} & ViewProps): JSX.Element => {
  const { provider, synced, user } = useCollaboration()
  const [, setIsFocused] = useAwareness(documentId)
  const [isChanged] = useYValue<boolean>('root.changed')
  const { status } = useSession()
  const [, setChanged] = useYValue<boolean>('root.changed')
  const environmentIsSane = provider && status === 'authenticated'
  const [showVerifyDialog, setShowVerifyDialog] = useState(false)
  const [documentStatus] = useWorkflowStatus(documentId, true, undefined, documentType)
  const isActive = !documentStatus || documentStatus.name === 'usable'
  const { concept } = useConcepts(documentType as ConceptTableDataKey)
  const [data] = useYValue<Block[]>('meta.core/definition')

  const textPaths = useMemo(() => {
    if (!data) return undefined
    const shortIndex = data?.findIndex((d) => d.role === 'short')
    const longIndex = data?.findIndex((d) => d.role === 'long')
    return { shortIndex, longIndex }
  }, [data])

  useEffect(() => {
    if (!provider?.document || !synced || !data) return
    const yRoot = provider.document.getMap('ele')
    const shortIndex = data?.findIndex((d) => d.role === 'short')
    const longIndex = data?.findIndex((d) => d.role === 'long')

    const indexCheck = {
      shortIndex: shortIndex || longIndex === 0 ? 1 : 0,
      longIndex: longIndex || shortIndex === 1 ? 0 : 1
    }
    if (shortIndex === -1) {
      setValueByYPath(yRoot, `meta.core/definition[${indexCheck.shortIndex}]`, toYStructure(Block.create({
        type: 'core/definition',
        role: 'short',
        data: {
          text: ''
        }
      })))
    }
    if (longIndex === -1 || !data) {
      setValueByYPath(yRoot, `meta.core/definition[${indexCheck.longIndex}]`, toYStructure(Block.create({
        type: 'core/definition',
        role: 'long',
        data: {
          text: ''
        }
      })))
    }
  }, [data, provider?.document, synced])

  useEffect(() => {
    provider?.setAwarenessField('data', user)
    setIsFocused(true)

    return () => {
      setIsFocused(false)
    }
    // We only want to rerun when provider change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider])

  const handleChange = useCallback((value: boolean): void => {
    const root = provider?.document.getMap('ele').get('root') as Y.Map<unknown>
    const changed = root.get('changed') as boolean
    if (changed !== value) {
      root.set('changed', value)
    }
  }, [provider])

  const handleSubmit = (): void => {
    if (environmentIsSane) {
      void snapshotDocument(documentId, { status: 'usable', addToHistory: true }).then((response) => {
        if (response?.statusMessage) {
          toast.error('Kunde inte skapa ny inställning!', {
            duration: 5000,
            position: 'top-center'
          })
          return
        }
        setChanged(false)
        if (onDialogClose) {
          onDialogClose()
        }
      })
    }
  }

  const handleCancel = () => {
    if (isChanged) {
      setShowVerifyDialog(true)
    } else {
      if (onDialogClose) {
        onDialogClose()
      }
    }
  }

  return (
    !concept || !provider
      ? <LoadingText>Laddar data</LoadingText>
      : (
          <>
            <View.Root asDialog={asDialog} className={className}>
              <ConceptHeader
                documentId={documentId}
                asDialog={!!asDialog}
                isChanged={isChanged}
                onDialogClose={onDialogClose}
                type={concept?.conceptTitle ?? 'Concept'}
                documentType={concept?.documentType ?? ''}
              />
              {!!provider && synced
                ? (
                    <View.Content className='flex flex-col max-w-[1000px] p-5'>
                      <Form.Root
                        asDialog={asDialog}
                        onChange={handleChange}
                      >
                        {concept.content({ isActive, handleChange, textPaths, asDialog, provider })}
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
                              {`Skapa ${concept.conceptTitle.toLocaleLowerCase()}`}
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
                  onPrimary={() => onDialogClose && onDialogClose()}
                  primaryLabel='Ja'
                  onSecondary={() => setShowVerifyDialog(false)}
                  secondaryLabel='Nej'
                />
              )}
            </View.Root>
          </>
        )
  )
}

Concept.meta = meta
