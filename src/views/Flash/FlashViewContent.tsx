import {
  Awareness,
  Section,
  View
} from '@/components'
import type { DefaultValueOption, ViewProps } from '@/types'
import { Button, Checkbox, ComboBox, Label } from '@ttab/elephant-ui'
import { CircleXIcon, Tags, GanttChartSquare } from '@ttab/elephant-ui/icons'
import { useCollaboration, useYValue, useRegistry } from '@/hooks'
import { useSession } from 'next-auth/react'
import type { Dispatch, SetStateAction } from 'react'
import { useRef, useState } from 'react'
import { FlashEditor } from './FlashEditor'
import { UserMessage } from '@/components/UserMessage'
import { Form } from '@/components/Form'
import { fetch } from '@/lib/index/fetch-plannings-twirp'
import type { CreateFlashDocumentStatus } from './lib/createFlash'
import { createFlash } from './lib/createFlash'
import { CreatePrompt } from '@/components/CreatePrompt'
import { FlashHeader } from './FlashHeader'

export const FlashViewContent = (props: ViewProps): JSX.Element => {
  const { provider } = useCollaboration()
  const { status, data: session } = useSession()
  const planningAwareness = useRef<(value: boolean) => void>(null)
  const [sendPrompt, setSendPrompt] = useState(false)
  const [savePrompt, setSavePrompt] = useState(false)
  const [donePrompt, setDonePrompt] = useState(false)
  const [selectedPlanning, setSelectedPlanning] = useState<DefaultValueOption | undefined>(undefined)
  const [title, setTitle] = useYValue<string | undefined>('root.title', true)
  const { index, locale, timeZone } = useRegistry()
  const [searchOlder, setSearchOlder] = useState(false)
  const [section, setSection] = useState<{
    type: string
    rel: string
    uuid: string
    title: string
  } | undefined>(undefined)
  const [documentId] = useYValue<string>('root.uuid')

  const handleSubmit = (setCreatePrompt: Dispatch<SetStateAction<boolean>>): void => {
    setCreatePrompt(true)
  }

  const promptConfig = [
    {
      visible: sendPrompt,
      key: 'send',
      title: 'Skapa och skicka flash?',
      description: !selectedPlanning
        ? 'En ny planering med tillhörande uppdrag för denna flash kommer att skapas åt dig.'
        : `Denna flash kommer att läggas i ett nytt uppdrag i planeringen "${selectedPlanning.label}"`,
      secondaryLabel: 'Avbryt',
      primaryLabel: 'Skicka',
      documentStatus: 'usable' as CreateFlashDocumentStatus,
      setPrompt: setSendPrompt
    },
    {
      visible: donePrompt,
      key: 'done',
      title: 'Skapa och klarmarkera flash?',
      description: !selectedPlanning
        ? 'En ny planering med tillhörande uppdrag för denna flash kommer att skapas åt dig.'
        : `Denna flash kommer att läggas i ett nytt uppdrag i planeringen "${selectedPlanning.label}". Med status godkänd.`,
      secondaryLabel: 'Avbryt',
      primaryLabel: 'Klarmarkera',
      documentStatus: 'done' as CreateFlashDocumentStatus,
      setPrompt: setDonePrompt
    },
    {
      visible: savePrompt,
      key: 'save',
      title: 'Spara flash?',
      description: !selectedPlanning
        ? 'En ny planering med tillhörande uppdrag för denna flash kommer att skapas åt dig.'
        : `Denna flash kommer att läggas i ett nytt uppdrag i planeringen "${selectedPlanning.label}"`,
      secondaryLabel: 'Avbryt',
      primaryLabel: 'Spara',
      documentStatus: undefined,
      setPrompt: setSavePrompt
    }
  ]

  return (
    <View.Root asDialog={props.asDialog} className={props.className}>
      <FlashHeader id={documentId} asDialog={props.asDialog} onDialogClose={props.onDialogClose} />
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
                    fetch={(query) => fetch(query, session, index, locale, timeZone, { searchOlder })}
                    minSearchChars={2}
                    modal={props.asDialog}
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
                <>
                  <Checkbox
                    id='SearchOlder'
                    defaultChecked={searchOlder}
                    onCheckedChange={(checked: boolean) => { setSearchOlder(checked) }}
                  />
                  <Label htmlFor='SearchOlder' className='text-muted-foreground'>Visa äldre</Label>
                </>
              </Form.Group>
            )}


            {!selectedPlanning && props.asDialog && (
              <Form.Group icon={Tags}>
                <Section onSelect={setSection} />
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
            promptConfig.map((config) =>
              config.visible && (
                <CreatePrompt
                  key={config.key}
                  title={config.title}
                  description={config.description}
                  secondaryLabel={config.secondaryLabel}
                  primaryLabel={config.primaryLabel}
                  onPrimary={() => {
                    if (!provider || !props.id || !session) {
                      console.error('Environment is not sane, flash cannot be created')
                      return
                    }

                    if (props?.onDialogClose) {
                      props.onDialogClose(props.id, title)
                    }

                    createFlash({
                      flashProvider: provider,
                      status,
                      session,
                      planningId: selectedPlanning?.value,
                      timeZone,
                      documentStatus: config.documentStatus,
                      section: (!selectedPlanning?.value) ? section || undefined : undefined
                    })
                      .then(() => {
                        config.setPrompt(false)
                      })
                      .catch((ex: unknown) => {
                        console.log(ex)
                      })
                  }}
                  onSecondary={() => {
                    config.setPrompt(false)
                  }}
                />
              )
            )
          }

          {
            props.asDialog && (
              <Form.Footer>
                <Form.Submit
                  onSubmit={() => handleSubmit(setSendPrompt)}
                  onSecondarySubmit={() => handleSubmit(setSavePrompt)}
                  onTertiarySubmit={() => handleSubmit(setDonePrompt)}
                >
                  <div className='flex justify-between'>
                    <div className='flex gap-2'>
                      <Button variant='secondary' type='button' role='secondary'>Utkast</Button>
                      <Button variant='secondary' type='button' role='tertiary'>Klarmarkera</Button>
                    </div>
                    <Button type='submit' role='primary'>Publicera</Button>
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
