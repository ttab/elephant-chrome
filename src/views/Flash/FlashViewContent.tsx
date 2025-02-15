import {
  ViewHeader,
  Awareness,
  Section,
  View
} from '@/components'
import type { ViewProps } from '@/types'
import { Button, ComboBox } from '@ttab/elephant-ui'
import { CircleXIcon, ZapIcon, Tags, GanttChartSquare } from '@ttab/elephant-ui/icons'
import { useCollaboration, useYValue, useRegistry } from '@/hooks'
import { useSession } from 'next-auth/react'
import { useRef, useState } from 'react'
import { Prompt } from '@/components'
import { UserMessage } from '@/components/UserMessage'
import { Form } from '@/components/Form'
import { useActiveAuthor } from '@/hooks/useActiveAuthor'
import { fetch } from '@/components/DialogView/lib/fetch'
import type { PropsWithChildren } from 'react'
import { FlashEditor } from './FlashEditor'
import type { DialogViewCreate } from '@/components/DialogView'
import { createFlash } from '@/components/DialogView/lib/createFlash'

export const FlashViewContent = (props: ViewProps & {
  documentId: string
} & DialogViewCreate & PropsWithChildren): JSX.Element | undefined => {
  const {
    selectedPlanning,
    setSelectedPlanning,
    handleSubmit,
    planningDocument,
    planningId
  } = props

  const { provider } = useCollaboration()
  const { status, data: session } = useSession()
  const { timeZone } = useRegistry()
  const planningAwareness = useRef<(value: boolean) => void>(null)
  const [title, setTitle] = useYValue<string | undefined>('root.title', true)
  const author = useActiveAuthor()
  const { index } = useRegistry()
  const [showVerifyDialog, setShowVerifyDialog] = useState(false)

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
              </Form.Group>
            )}


            <FlashEditor setTitle={setTitle} />
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

                  createFlash(
                    props.documentId,
                    title,
                    provider,
                    status,
                    session,
                    planningDocument,
                    planningId,
                    timeZone,
                    author
                  )

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
                <Button type='submit'>Skicka flash</Button>
              </div>
            </Form.Submit>
          </Form.Footer>
        </Form.Root>
      </View.Content>
    </View.Root>
  )
}

