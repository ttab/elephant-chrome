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
import { useRef, useState } from 'react'
import { FlashEditor } from './FlashEditor'
import { UserMessage } from '@/components/UserMessage'
import { Form } from '@/components/Form'
import { useActiveAuthor } from '@/hooks/useActiveAuthor'
import { fetch } from '@/lib/index/fetch-plannings-twirp'
import { createFlash } from './lib/createFlash'
import type * as Y from 'yjs'
import { CreatePrompt } from '@/components/CreatePrompt'

export const FlashViewContent = (props: ViewProps): JSX.Element | undefined => {
  const { provider } = useCollaboration()
  const { status, data: session } = useSession()
  const { timeZone } = useRegistry()
  const planningAwareness = useRef<(value: boolean) => void>(null)
  const [showVerifyDialog, setShowVerifyDialog] = useState(false)
  const [selectedPlanning, setSelectedPlanning] = useState<DefaultValueOption | undefined>(undefined)
  const [title, setTitle] = useYValue<string | undefined>('root.title', true)
  // const [, setSection] = useYValue<EleBlock | undefined>('links.core/section[0]')
  const author = useActiveAuthor({ full: false })
  const { index } = useRegistry()

  /* useEffect(() => {
    if (planningDocument) {
      const [planningSection] = getValueByYPath<EleBlock>(planningDocument.getMap('ele'), 'links.core/section[0]')
      if (planningSection) {
        setSection(planningSection)
      }
    }
  }, [planningDocument, setSection]) */


  const handleSubmit = (): void => {
    setShowVerifyDialog(true)
  }

  return (
    <View.Root asDialog={props.asDialog} className={props.className}>
      <ViewHeader.Root>
        {!props.asDialog
        && <ViewHeader.Title title='Flash' icon={ZapIcon} iconColor='#FF5150' />}

        <ViewHeader.Content>
          <div className='flex w-full h-full items-center space-x-2 font-bold'>
            <ViewHeader.Title title='Skapa ny flash' icon={ZapIcon} iconColor='#FF3140' />
          </div>
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

            <FlashEditor setTitle={setTitle} />

            <UserMessage selectedPlanning={selectedPlanning} asDialog={!!props?.asDialog} />

          </Form.Content>

          {
            showVerifyDialog
            && (
              <CreatePrompt
                title='Skapa och skicka flash?'
                description={!selectedPlanning
                  ? 'En ny planering med tillhörande uppdrag för denna flash kommer att skapas åt dig.'
                  : `Denna flash kommer att läggas i ett nytt uppdrag i planeringen "${selectedPlanning.label}`}
                secondaryLabel='Avbryt'
                primaryLabel='Skicka'
                selectedPlanning={selectedPlanning}
                payload={{ newsvalue: '4' }}
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
                    timeZone,
                    author,
                    hasSelectedPlanning: !!selectedPlanning
                  })

                  setShowVerifyDialog(false)
                }}
                onSecondary={() => {
                  setShowVerifyDialog(false)
                }}
              />
            )
          }

          {
            props.asDialog && (
              <Form.Footer>
                <Form.Submit onSubmit={handleSubmit}>
                  <div className='flex justify-end'>
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
