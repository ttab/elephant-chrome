import {
  Awareness,
  Section,
  View
} from '@/components'
import type { DefaultValueOption, ViewProps } from '@/types'
import { Button, ComboBox } from '@ttab/elephant-ui'
import { CircleXIcon, Tags, GanttChartSquare } from '@ttab/elephant-ui/icons'
import { useCollaboration, useYValue, useRegistry } from '@/hooks'
import { useSession } from 'next-auth/react'
import type { Dispatch, SetStateAction } from 'react'
import { useRef, useState } from 'react'
import { FlashEditor } from './FlashEditor'
import { UserMessage } from '@/components/UserMessage'
import { Form } from '@/components/Form'
import { fetch } from '@/lib/index/fetch-plannings-twirp'
import { createFlash } from './lib/createFlash'
import type * as Y from 'yjs'
import { CreatePrompt } from '@/components/CreatePrompt'
import { Block } from '@ttab/elephant-api/newsdoc'
import { FlashHeader } from './FlashHeader'

export const FlashViewContent = (props: ViewProps): JSX.Element => {
  const { provider } = useCollaboration()
  const { status, data: session } = useSession()
  const planningAwareness = useRef<(value: boolean) => void>(null)
  const [sendPrompt, setSendPrompt] = useState(false)
  const [savePrompt, setSavePrompt] = useState(false)
  const [selectedPlanning, setSelectedPlanning] = useState<DefaultValueOption | undefined>(undefined)
  const [title, setTitle] = useYValue<string | undefined>('root.title', true)
  const { index, timeZone } = useRegistry()

  const [documentId] = useYValue<string>('root.uuid')

  const handleSubmit = (setCreatePrompt: Dispatch<SetStateAction<boolean>>): void => {
    setCreatePrompt(true)
  }

  return (
    <View.Root asDialog={props.asDialog} className={props.className}>
      <FlashHeader id={documentId} asDialog={props.asDialog} />
      <View.Content>
        <Form.Root asDialog={props.asDialog}>
          <Form.Content>
            {props.asDialog && (
              <Form.Group icon={GanttChartSquare}>
                <Awareness path='FlashPlanningItem' ref={planningAwareness}>
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

                {!!selectedPlanning && (
                  <>
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
                  </>
                )}
              </Form.Group>
            )}


            {!selectedPlanning && props.asDialog && (
              <Form.Group icon={Tags}>
                <Section />
              </Form.Group>
            )}

            <FlashEditor setTitle={setTitle} />

            <UserMessage asDialog={!!props?.asDialog}>
              {!selectedPlanning
                ? (<>Väljer du ingen planering kommer en ny planering med tillhörande uppdrag skapas åt dig.</>)
                : (<>Denna flash kommer läggas i ett nytt uppdrag i den valda planeringen</>)}
            </UserMessage>

          </Form.Content>

          {
            sendPrompt
            && (
              <CreatePrompt
                title='Skapa och skicka flash?'
                description={!selectedPlanning
                  ? 'En ny planering med tillhörande uppdrag för denna flash kommer att skapas åt dig.'
                  : `Denna flash kommer att läggas i ett nytt uppdrag i planeringen "${selectedPlanning.label}"`}
                secondaryLabel='Avbryt'
                primaryLabel='Skicka'
                selectedPlanning={selectedPlanning}
                payload={{
                  meta: {
                    'core/newsvalue': [Block.create({ type: 'core/newsvalue', value: '4' })]
                  }
                }}
                onPrimary={(planning: Y.Doc | undefined, planningId: string | undefined) => {
                  if (!provider || !props.id || !provider || !session) {
                    console.error('Environment is not sane, flash cannot be created')
                    return
                  }

                  if (props?.onDialogClose) {
                    props.onDialogClose(props.id, title)
                  }

                  createFlash({
                    provider,
                    status,
                    session,
                    planning: {
                      document: planning,
                      id: planningId
                    },
                    hasSelectedPlanning: !!selectedPlanning,
                    timeZone,
                    documentStatus: 'done'
                  })

                  setSendPrompt(false)
                }}
                onSecondary={() => {
                  setSendPrompt(false)
                }}
              />
            )
          }

          {
            savePrompt
            && (
              <CreatePrompt
                title='Skapa flash?'
                description={!selectedPlanning
                  ? 'En ny planering med tillhörande uppdrag för denna flash kommer att skapas åt dig.'
                  : `Denna flash kommer att läggas i ett nytt uppdrag i planeringen "${selectedPlanning.label}"`}
                secondaryLabel='Avbryt'
                primaryLabel='Spara'
                selectedPlanning={selectedPlanning}
                payload={{
                  meta: {
                    'core/newsvalue': [Block.create({ type: 'core/newsvalue', value: '4' })]
                  }
                }}
                onPrimary={(planning: Y.Doc | undefined, planningId: string | undefined) => {
                  if (!provider || !props.id || !provider || !session) {
                    console.error('Environment is not sane, flash cannot be created')
                    return
                  }

                  if (props?.onDialogClose) {
                    props.onDialogClose(props.id, title)
                  }

                  createFlash({
                    provider,
                    status,
                    session,
                    planning: {
                      document: planning,
                      id: planningId
                    },
                    hasSelectedPlanning: !!selectedPlanning,
                    timeZone
                  })

                  setSavePrompt(false)
                }}
                onSecondary={() => {
                  setSavePrompt(false)
                }}
              />
            )
          }

          {
            props.asDialog && (
              <Form.Footer>
                <Form.Submit onSubmit={() => handleSubmit(setSendPrompt)}>
                  <div className='flex justify-end gap-4'>
                    <Button
                      variant='secondary'
                      onClick={() => {
                        handleSubmit(setSavePrompt)
                      }}
                    >
                      Spara flash
                    </Button>
                    <Button type='submit'>Skicka flash</Button>
                  </div>
                </Form.Submit>
              </Form.Footer>
            )
          }
        </Form.Root>
      </View.Content>
    </View.Root>
  )
}
