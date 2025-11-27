import type { ViewMetadata, ViewProps } from '@/types/index'
import type * as Y from 'yjs'
import { useQuery } from '@/hooks/useQuery'
import { AwarenessDocument } from '@/components/AwarenessDocument'
import { Error } from '../Error'
import { useCollaboration } from '@/hooks/useCollaboration'
import { useAwareness } from '@/hooks/useAwareness'
import { useYValue } from '@/hooks/useYValue'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useState } from 'react'
import { View } from '@/components/View'
import { ConceptHeader } from '../Concepts/components/ConceptHeader'
import { InfoIcon } from '@ttab/elephant-ui/icons'
import { Button } from '@ttab/elephant-ui'
import { Form } from '@/components/Form'
import { Prompt } from '@/components/Prompt'
import { useWorkflowStatus } from '@/hooks/useWorkflowStatus'
import { useConcepts } from '../Concepts/lib/useConcepts'
import { type ConceptTableDataKey } from '../Concepts/lib/conceptDataTable'
import { LoadingText } from '@/components/LoadingText'
import { ConceptContentRender } from './lib/ConceptContentRender'
import { handleCancel } from './lib/handleCancel'
import { handleSubmit } from './lib/handleSubmit'
import { handleRootChange } from './lib/handleRootChange'

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

  useEffect(() => {
    provider?.setAwarenessField('data', user)
    setIsFocused(true)

    return () => {
      setIsFocused(false)
    }
    // We only want to rerun when provider change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider])

  const handleChange = useCallback(
    (value: boolean) => {
      handleRootChange(value, provider)
    }, [provider])

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
                        <ConceptContentRender documentType={documentType} concept={concept} provider={provider} isActive={isActive} asDialog={asDialog} handleChange={handleChange} />
                        <Form.Footer>
                          <Form.Submit
                            onSubmit={() => handleSubmit(environmentIsSane, documentId, setChanged, onDialogClose)}
                            onReset={() => handleCancel(isChanged, setShowVerifyDialog, onDialogClose)}
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
