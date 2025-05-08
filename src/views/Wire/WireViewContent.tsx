import {
  ViewHeader,
  Awareness,
  Section,
  View,
  Newsvalue,
  Title
} from '@/components'
import type { ViewProps } from '@/types'
import type { DefaultValueOption } from '@ttab/elephant-ui'
import { Button, Checkbox, ComboBox, Input, Label } from '@ttab/elephant-ui'
import { CircleXIcon, Tags, GanttChartSquare, Cable, BriefcaseBusiness, Tag } from '@ttab/elephant-ui/icons'
import { useCollaboration, useRegistry, useYValue } from '@/hooks'
import { useSession } from 'next-auth/react'
import { useRef, useState } from 'react'
import { UserMessage } from '@/components/UserMessage'
import { Form } from '@/components/Form'
import { fetch } from '@/lib/index/fetch-plannings-twirp'
import { createArticle } from './lib/createArticle'
import { SluglineEditable } from '@/components/DataItem/SluglineEditable'
import type * as Y from 'yjs'
import { CreatePrompt } from '@/components/CreatePrompt'
import type { Wire as WireType } from '@/hooks/index/useDocuments/schemas/wire'
import { toSlateYXmlText } from '@/shared/yUtils'

export const WireViewContent = (props: ViewProps & {
  wire: WireType
}): JSX.Element | undefined => {
  const { provider } = useCollaboration()
  const { status, data: session } = useSession()
  const [showVerifyDialog, setShowVerifyDialog] = useState(false)
  const [searchOlder, setSearchOlder] = useState(false)
  const [selectedPlanning, setSelectedPlanning] = useState<DefaultValueOption & { payload: { slugline?: string, sluglines?: string[] } } | undefined>(undefined)
  const documentAwareness = useRef<(value: boolean) => void>(null)
  const planningTitleRef = useRef<HTMLInputElement>(null)
  const { index, locale, timeZone } = useRegistry()

  const [slugline, setSlugline] = useYValue<Y.XmlText>('meta.tt/slugline[0].value')

  const handleSubmit = (): void => {
    setShowVerifyDialog(true)
  }

  return (
    <View.Root asDialog={props.asDialog} className={props.className}>
      <ViewHeader.Root>
        <ViewHeader.Content>
          {props.asDialog && (
            <div className='flex w-full h-full items-center space-x-2 font-bold'>
              <ViewHeader.Title name='Wires' title='Skapa artikel' icon={Cable} iconColor='#FF6347' />
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
            <Form.Group icon={Cable}>
              <>
                <Input
                  className='pl-0 pt-2 h-8 text-medium border-0 truncate'
                  readOnly
                  value={props.wire.fields['document.title'].values?.[0]}
                />
              </>
            </Form.Group>
            <Form.Group icon={GanttChartSquare}>
              <Awareness path='wirePlanningItem' ref={documentAwareness}>
                <ComboBox
                  max={1}
                  size='xs'
                  modal={props.asDialog}
                  className='min-w-0 w-full truncate justify-start max-w-48'
                  selectedOptions={selectedPlanning ? [selectedPlanning] : []}
                  placeholder='Välj planering'
                  onOpenChange={(isOpen: boolean) => {
                    if (documentAwareness?.current) {
                      documentAwareness.current(isOpen)
                    }
                  }}
                  fetch={(query) => fetch(query, session, index, locale, timeZone, {
                    searchOlder,
                    sluglines: true
                  })}
                  minSearchChars={2}
                  onSelect={(option) => {
                    if (setSelectedPlanning) {
                      const slugline = (option.payload as { slugline: string | undefined }).slugline
                      const sluglines = (option.payload as { sluglines: string[] | undefined }).sluglines

                      if (option.value !== selectedPlanning?.value) {
                        setSelectedPlanning({
                          value: option.value,
                          label: option.label,
                          payload: {
                            slugline,
                            sluglines
                          }
                        })

                        setSlugline(toSlateYXmlText(slugline || ''))
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
                  <>
                    <Button
                      variant='ghost'
                      asChild
                      className='text-muted-foreground flex size-4 p-0 data-[state=open]:bg-muted hover:bg-accent2'
                      onClick={(e) => {
                        e.preventDefault()
                        if (setSelectedPlanning) {
                          setSelectedPlanning(undefined)
                        }
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
            {!selectedPlanning
              && (
                <Form.Group icon={GanttChartSquare}>
                  <>
                    <Input
                      className='pt-2 h-7 text-medium placeholder:text-[#5D709F] placeholder-shown:border-[#5D709F]'
                      placeholder='Planeringstitel'
                      ref={planningTitleRef}
                    />
                  </>
                </Form.Group>
              )}

            <Form.Group icon={BriefcaseBusiness}>
              <Title
                placeholder='Uppdragstitel'
              />
            </Form.Group>
            <Form.Group icon={Tag}>
              {selectedPlanning && (
                <SluglineEditable
                  key={selectedPlanning?.value}
                  compareValues={[
                    ...(selectedPlanning?.payload?.sluglines || []),
                    slugline?.toString()
                  ]}
                  path='meta.tt/slugline[0].value'
                />
              )}
              {(!selectedPlanning) && (
                <SluglineEditable
                  path='meta.tt/slugline[0].value'
                />
              )}
            </Form.Group>
            <UserMessage asDialog={!!props?.asDialog}>
              {!selectedPlanning
                ? (
                  <>Väljer du ingen planering kommer en ny planering med tillhörande uppdrag skapas åt dig.</>
                )
                : (
                  <>Denna artikel kommer läggas i ett nytt uppdrag i den valda planeringen</>
                )}
            </UserMessage>

          </Form.Content>

          {
            showVerifyDialog
            && (
              <CreatePrompt
                title='Skapa artikel från telegram'
                description={!selectedPlanning
                  ? 'En ny planering med tillhörande uppdrag för denna artikel kommer att skapas åt dig.'
                  : `Denna artikel kommer att läggas i ett nytt uppdrag i planeringen "${selectedPlanning.label}"`}
                secondaryLabel='Avbryt'
                primaryLabel='Skapa'
                selectedPlanning={selectedPlanning}
                onPrimary={(planning: Y.Doc | undefined, planningId: string | undefined) => {
                  if (!provider || !props.id || !session) {
                    console.error('Environment is not sane, article cannot be created')
                    return
                  }

                  if (props?.onDialogClose) {
                    props.onDialogClose(props.id)
                  }

                  createArticle({
                    provider,
                    status,
                    session,
                    planning: {
                      document: planning,
                      id: planningId,
                      title: planningTitleRef.current?.value
                    },
                    wire: props.wire,
                    hasSelectedPlanning: !!selectedPlanning
                  })
                  setShowVerifyDialog(false)
                  props.onDocumentCreated?.()
                }}
                onSecondary={() => {
                  setShowVerifyDialog(false)
                }}
              />
            )
          }

          <Form.Footer className='flex justify-between'>
            <>
              <Button
                variant='secondary'
                autoFocus
                onClick={() => {
                  props.onDialogClose?.()
                  props.onDocumentCreated?.()
                }}
              >
                Markera som använd
              </Button>
            </>
            <Form.Submit onSubmit={handleSubmit}>
              <Button type='submit'>Skapa artikel</Button>
            </Form.Submit>
          </Form.Footer>
        </Form.Root>
      </View.Content>
    </View.Root>
  )
}

