import {
  ViewHeader,
  Awareness,
  Section,
  View,
  Newsvalue
} from '@/components'
import type { ViewProps } from '@/types'
import { Button, ComboBox } from '@ttab/elephant-ui'
import { CircleXIcon, Tags, GanttChartSquare, Cable } from '@ttab/elephant-ui/icons'
import { useCollaboration, useRegistry } from '@/hooks'
import { useSession } from 'next-auth/react'
import { useRef, useState } from 'react'
import { Prompt } from '@/components'
import { UserMessage } from '@/components/UserMessage'
import { Form } from '@/components/Form'
import { fetch } from '@/components/DialogView/lib/fetch'
import type { PropsWithChildren } from 'react'
import type { DialogViewCreate } from '@/components/DialogView'
import { createArticle } from './lib/createArticle'
import { SluglineEditable } from '@/components/DataItem/SluglineEditable'
import type * as Y from 'yjs'

export const WireViewContent = (props: ViewProps & {
  document: Y.Doc
} & DialogViewCreate & PropsWithChildren): JSX.Element | undefined => {
  const {
    selectedPlanning,
    setSelectedPlanning,
    planningDocument,
    planningId
  } = props

  const { provider } = useCollaboration()
  const { status, data: session } = useSession()
  const [showVerifyDialog, setShowVerifyDialog] = useState(false)
  const planningAwareness = useRef<(value: boolean) => void>(null)
  const { index } = useRegistry()

  const handleSubmit = (): void => {
    if (!planningDocument) {
      return
    }
    setShowVerifyDialog(true)
  }


  return (
    <View.Root asDialog={props.asDialog} className={props.className}>
      <ViewHeader.Root>
        <ViewHeader.Content>
          {props.asDialog && (
            <div className='flex w-full h-full items-center space-x-2 font-bold'>
              <ViewHeader.Title title='Skapa artikel från telegram' icon={Cable} iconColor='#FF6347' />
            </div>
          )}
        </ViewHeader.Content>

        <ViewHeader.Action onDialogClose={props.onDialogClose}>
          {!props.asDialog && !!props.id
          && <ViewHeader.RemoteUsers documentId={props.id} />}
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
                    if (setSelectedPlanning) {
                      if (option.value !== selectedPlanning?.value) {
                        setSelectedPlanning({
                          value: option.value,
                          label: option.label
                        })
                      } else {
                        setSelectedPlanning(undefined)
                      }
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
                    if (setSelectedPlanning) {
                      setSelectedPlanning(undefined)
                    }
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
                <SluglineEditable
                  path='meta.tt/slugline[0].value'
                />
                <Newsvalue />
              </Form.Group>
            )}


            <UserMessage selectedPlanning={selectedPlanning} asDialog={!!props?.asDialog} />

          </Form.Content>

          {
            showVerifyDialog
            && (
              <Prompt
                title='Skapa artikel från telegram'
                description={!selectedPlanning
                  ? 'En ny planering med tillhörande uppdrag för denna artikel kommer att skapas åt dig.'
                  : `Denna artikel kommer att läggas i ett nytt uppdrag i planeringen "${selectedPlanning.label}`}
                secondaryLabel='Avbryt'
                primaryLabel='Skapa'
                onPrimary={() => {
                  if (!provider || !props.id || !props.document || !provider || !session) {
                    console.error('Environment is not sane, flash cannot be created')
                    return
                  }

                  if (props?.onDialogClose) {
                    props.onDialogClose(props.id)
                  }

                  createArticle({
                    documentId: props.id, // The article in this case
                    document: props.document, // The article in this case
                    title: '',
                    provider,
                    status,
                    session,
                    planningDocument,
                    planningId
                  })

                  if (setShowVerifyDialog) {
                    setShowVerifyDialog(false)
                  }
                }}
                onSecondary={() => {
                  if (setShowVerifyDialog) {
                    setShowVerifyDialog(false)
                  }
                }}
              />
            )
          }

          <Form.Footer>
            <Form.Submit onSubmit={handleSubmit}>
              <div className='flex justify-end'>
                <Button type='submit'>Skapa artikel från telegram</Button>
              </div>
            </Form.Submit>
          </Form.Footer>
        </Form.Root>
      </View.Content>
    </View.Root>
  )
}

