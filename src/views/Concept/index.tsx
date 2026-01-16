import type { ViewMetadata, ViewProps } from '@/types/index'
import type * as Y from 'yjs'
import { useQuery } from '@/hooks/useQuery'
import { Error } from '../Error'
import { useSession } from 'next-auth/react'
import { type JSX, useMemo, useState } from 'react'
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
import { useYDocument } from '@/modules/yjs/hooks'
import { getConceptTemplateFromDocumentType } from '@/shared/templates/lib/getConceptTemplateFromDocumentType'
import { toGroupedNewsDoc } from '@/shared/transformations/groupedNewsDoc'


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
export const Concept = (props: ViewProps & { document: Document }): JSX.Element => {
  const [query] = useQuery()
  const documentId = props.id || query.id

  return (
    <>
      {typeof documentId === 'string'
        ? (
            <ConceptContent {...props} />
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

const ConceptContent = (
  props: ViewProps & { document: Document }
): JSX.Element => {
  const documentType = props.documentType as string
  const documentId = props.id as string

  const data = useMemo(() => {
    if (!props.document || !props.id || !props.documentType || typeof props.id !== 'string') {
      return undefined
    }
    return toGroupedNewsDoc({
      version: 0n,
      isMetaDocument: false,
      mainDocument: '',
      document: getConceptTemplateFromDocumentType(documentType)(props.id)
    })
  }, [props, documentType])

  const ydoc = useYDocument<Y.Map<unknown>>(documentId, { data: data })
  const { status } = useSession()
  const environmentIsSane = ydoc.provider && status === 'authenticated'
  const [showVerifyDialog, setShowVerifyDialog] = useState(false)
  const [documentStatus] = useWorkflowStatus({ ydoc, documentId, isWorkflow: true, asPrint: false, documentType })
  const isActive = !documentStatus || documentStatus?.name === 'usable'
  const { concept } = useConcepts(props.documentType as ConceptTableDataKey)
  return (
    !concept || !ydoc.provider
      ? <LoadingText>Laddar data</LoadingText>
      : (
          <>
            <View.Root asDialog={props.asDialog} className={props.className}>
              <ConceptHeader
                ydoc={ydoc}
                asDialog={!!props.asDialog}
                onDialogClose={props.onDialogClose}
                type={concept?.conceptTitle ?? 'Concept'}
                documentType={concept?.documentType ?? ''}
              />
              {!!ydoc.provider && ydoc.synced
                ? (
                    <View.Content className='flex flex-col max-w-[1000px] p-5' variant='grid'>
                      <Form.Root asDialog={props?.asDialog}>
                        <ConceptContentRender documentType={concept?.documentType ?? ''} ydoc={ydoc} concept={concept} {...props} isActive={isActive} />
                        <Form.Footer>
                          <Form.Submit
                            onSubmit={() => handleSubmit(ydoc, props.onDialogClose)}
                            onReset={() => handleCancel(ydoc.isChanged, setShowVerifyDialog, props.onDialogClose)}
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
                  onPrimary={() => props.onDialogClose && props.onDialogClose()}
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
