import {
  ViewHeader,
  Awareness,
  Section,
  View
} from '@/components'
import type { DefaultValueOption, ViewProps } from '@/types'
import { Button, ComboBox } from '@ttab/elephant-ui'
import { CircleXIcon, ZapIcon, Tags, GanttChartSquare } from '@ttab/elephant-ui/icons'
import { useCollaboration, useYValue, useRegistry } from '@/hooks'
import { useSession } from 'next-auth/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useCollaborationDocument } from '@/hooks/useCollaborationDocument'
import { createDocument } from '@/lib/createYItem'
import * as Templates from '@/defaults/templates'
import { Prompt } from '@/components'
import { type EleBlock } from '@/shared/types'
import { getValueByYPath } from '@/lib/yUtils'
import { UserMessage } from '@/components/UserMessage'
import { Form } from '@/components/Form'
import { useActiveAuthor } from '@/hooks/useActiveAuthor'
import { fetch } from './lib/fetch'
import type { PropsWithChildren } from 'react'
import type { HocuspocusProvider } from '@hocuspocus/provider'
import type { Session } from 'next-auth'
import type { IDBAuthor } from 'src/datastore/types'
import type { Document } from '@ttab/elephant-api/newsdoc'
import type * as Y from 'yjs'

export const CreateDialogContent = (props: ViewProps & {
  documentId: string
  handleCreate: (
    documentId: string,
    title: string | undefined,
    provider: HocuspocusProvider,
    status: string,
    session: Session,
    planningDocument: Y.Doc | undefined,
    newPlanningDocument: Y.Doc | undefined,
    timeZone: string,
    author: Document | IDBAuthor | undefined | null
  ) => void
} & PropsWithChildren): JSX.Element | undefined => {
  const { provider } = useCollaboration()
  const { status, data: session } = useSession()
  const { timeZone } = useRegistry()
  const planningAwareness = useRef<(value: boolean) => void>(null)
  const [showVerifyDialog, setShowVerifyDialog] = useState(false)
  const [selectedPlanning, setSelectedPlanning] = useState<DefaultValueOption | undefined>(undefined)
  const [title, setTitle] = useYValue<string | undefined>('root.title', true)
  const [, setSection] = useYValue<EleBlock | undefined>('links.core/section[0]')
  const author = useActiveAuthor()
  const { index } = useRegistry()
  const [newPlanningId, newPlanningYDoc] = useMemo(() => {
    return createDocument({
      template: Templates.planning,
      inProgress: true,
      payload: { newsvalue: '4' }
    })
  }, [])

  // New and empty planning document for when creating new flash and planning
  const { document: newPlanningDocument } = useCollaborationDocument({
    documentId: newPlanningId,
    initialDocument: newPlanningYDoc
  })

  // Existing planning document for when adding flash to existing
  const { document: planningDocument } = useCollaborationDocument({
    documentId: selectedPlanning?.value
  })

  useEffect(() => {
    if (planningDocument) {
      const [planningSection] = getValueByYPath<EleBlock>(planningDocument.getMap('ele'), 'links.core/section[0]')
      if (planningSection) {
        setSection(planningSection)
      }
    }
  }, [planningDocument, setSection])


  const handleSubmit = (): void => {
    if (!planningDocument && !newPlanningDocument) {
      return
    }
    setShowVerifyDialog(true)
  }

  return (
    <View.Root asDialog={props.asDialog} className={props.className}>
      <ViewHeader.Root>
        {!props.asDialog
        && <ViewHeader.Title title='Flash' icon={ZapIcon} iconColor='#FF5150' />}

        <ViewHeader.Content>
          {props.asDialog && (
            <div className='flex w-full h-full items-center space-x-2 font-bold'>
              <ViewHeader.Title title='Skapa ny flash' icon={ZapIcon} iconColor='#FF3140' />
            </div>
          )}
        </ViewHeader.Content>

        <ViewHeader.Action onDialogClose={props.onDialogClose}>
          {!props.asDialog && !!props.documentId
          && <ViewHeader.RemoteUsers documentId={props.documentId} />}
        </ViewHeader.Action>
      </ViewHeader.Root>

      <View.Content>
        <Form.Root asDialog={props.asDialog}>
          <Form.Content>
            <Form.Group icon={GanttChartSquare}>
              <Awareness name='FlashPlanningItem' ref={planningAwareness}>
                <ComboBox
                  max={1}
                  size='xs'
                  className='min-w-0 w-full truncate justify-start max-w-48'
                  selectedOptions={selectedPlanning ? [selectedPlanning] : []}
                  placeholder='Välj planering'
                  onOpenChange={(isOpen: boolean) => {
                    if (planningAwareness?.current) {
                      planningAwareness.current(isOpen)
                    }
                  }}
                  fetch={(query) => fetch(query, session, index)}
                  minSearchChars={2}
                  onSelect={(option) => {
                    if (option.value !== selectedPlanning?.value) {
                      setSelectedPlanning({
                        value: option.value,
                        label: option.label
                      })
                    } else {
                      setSelectedPlanning(undefined)
                    }
                  }}
                >
                </ComboBox>
              </Awareness>

              {!!selectedPlanning
              && (
                <Button
                  variant='ghost'
                  className='text-muted-foreground flex h-7 w-7 p-0 data-[state=open]:bg-muted hover:bg-accent2'
                  onClick={(e) => {
                    e.preventDefault()
                    setSelectedPlanning(undefined)
                  }}
                >
                  <CircleXIcon size={18} strokeWidth={1.75} />
                </Button>
              )}
            </Form.Group>


            {!selectedPlanning
            && (
              <Form.Group icon={Tags}>
                <Section />
              </Form.Group>
            )}


            {props.children}
            <UserMessage selectedPlanning={selectedPlanning} asDialog={!!props?.asDialog} />

          </Form.Content>

          {
            showVerifyDialog
            && (
              <Prompt
                title='Skapa och skicka flash?'
                description={!selectedPlanning
                  ? 'En ny planering med tillhörande uppdrag för denna flash kommer att skapas åt dig.'
                  : `Denna flash kommer att läggas i ett nytt uppdrag i planeringen "${selectedPlanning.label}`}
                secondaryLabel='Avbryt'
                primaryLabel='Skicka'
                onPrimary={() => {
                  if (!provider || !props.documentId || !provider || !session) {
                    console.error('Environment is not sane, flash cannot be created')
                    return
                  }

                  if (props?.onDialogClose) {
                    props.onDialogClose(props.documentId, title)
                  }

                  props.handleCreate(props.documentId, title, provider, status, session, planningDocument, newPlanningDocument, timeZone, author)

                  setShowVerifyDialog(false)
                }}
                onSecondary={() => {
                  setShowVerifyDialog(false)
                }}
              />
            )
          }

          <Form.Footer>
            <Form.Submit onSubmit={handleSubmit}>
              <div className='flex justify-end'>
                <Button type='submit'>Skicka flash</Button>
              </div>
            </Form.Submit>
          </Form.Footer>
        </Form.Root>
      </View.Content>
    </View.Root>
  )
}

