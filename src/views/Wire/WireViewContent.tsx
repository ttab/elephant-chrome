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
import type { PropsWithChildren } from 'react'
import { useEffect, useRef, useState } from 'react'
import { UserMessage } from '@/components/UserMessage'
import { Form } from '@/components/Form'
import { fetch } from '@/lib/index/fetch-plannings-twirp'
import { createArticle } from './lib/createArticle'
import { SluglineEditable } from '@/components/DataItem/SluglineEditable'
import type * as Y from 'yjs'
import { CreatePrompt } from '@/components/CreatePrompt'
import type { Wire as WireType } from '@/hooks/index/useDocuments/schemas/wire'
import { toSlateYXmlText } from '@/shared/yUtils'
import type { FormProps } from '@/components/Form/Root'
import { useDocuments } from '@/hooks/index/useDocuments'
import { QueryV1, BoolQueryV1, TermQueryV1 } from '@ttab/elephant-api/index'
import { Block } from '@ttab/elephant-api/newsdoc'

export const WireViewContent = (props: ViewProps & {
  wire: WireType
}): JSX.Element | undefined => {
  const { provider } = useCollaboration()
  const { status, data: session } = useSession()
  const [showVerifyDialog, setShowVerifyDialog] = useState(false)
  const [searchOlder, setSearchOlder] = useState(false)
  const [selectedPlanning, setSelectedPlanning] = useState<DefaultValueOption & { payload: { slugline?: string, sluglines?: string[], newsvalue?: string } } | undefined>(undefined)
  const documentAwareness = useRef<(value: boolean) => void>(null)
  const planningTitleRef = useRef<HTMLInputElement>(null)
  const { index, locale, timeZone } = useRegistry()
  const [section, setSection] = useState<{
    type: string
    rel: string
    uuid: string
    title: string
  } | undefined>(undefined)
  const [slugline, setSlugline] = useYValue<Y.XmlText>('meta.tt/slugline[0].value')
  const [_newsvalue, setNewsValue] = useYValue<string>('meta.core/newsvalue[0].value')
  const [contentSource, setContentSource] = useYValue<Block[]>('links.core/content-source')

  const providerUri = props.wire?.fields['document.rel.provider.uri']?.values[0] || ''
  const { data, isLoading } = useDocuments({
    documentType: 'tt/wire-provider',
    fields: ['document.rel.use_source.uri', 'document.rel.use_source.title'],
    query: QueryV1.create({
      conditions: {
        oneofKind: 'bool',
        bool: BoolQueryV1.create({
          must: [
            {
              conditions: {
                oneofKind: 'term',
                term: TermQueryV1.create({
                  field: 'document.uri',
                  value: providerUri
                })
              }
            }
          ]
        })
      }
    })
  })

  const handleSubmit = (): void => {
    if (!isLoading) {
      const sourceTitle = data?.[0]?.fields['document.rel.use_source.title']?.values[0]
      const sourceUri = data?.[0]?.fields['document.rel.use_source.uri']?.values[0]

      if (sourceTitle && sourceUri) {
        setContentSource([
          ...contentSource || [],
          Block.create({
            type: 'core/content-source',
            title: sourceTitle,
            uri: sourceUri,
            rel: 'source'
          })
        ])
      }
    }
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

        <ViewHeader.Action onDialogClose={props.onDialogClose} asDialog={props.asDialog}>
          {!props.asDialog && !!props.id && <ViewHeader.RemoteUsers documentId={props.id} />}
        </ViewHeader.Action>
      </ViewHeader.Root>

      <View.Content>
        <Form.Root asDialog={props.asDialog}>
          {!!selectedPlanning && <ValidateNow />}
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
                      const newsvalue = (option.payload as { newsvalue: string | undefined }).newsvalue

                      if (option.value !== selectedPlanning?.value) {
                        setSelectedPlanning({
                          value: option.value,
                          label: option.label,
                          payload: {
                            slugline,
                            sluglines,
                            newsvalue
                          }
                        })

                        setSlugline(toSlateYXmlText(slugline || ''))
                        if (newsvalue) {
                          setNewsValue(newsvalue)
                        }
                      } else {
                        setSelectedPlanning(undefined)
                      }
                    }
                  }}
                >
                </ComboBox>
              </Awareness>

              {!!selectedPlanning && (
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


            {!selectedPlanning && (
              <Form.Group icon={Tags}>
                <Section onSelect={setSection} />
                <SluglineEditable
                  path='meta.tt/slugline[0].value'
                />
                <Newsvalue />
              </Form.Group>


            )}
            {!selectedPlanning && (
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

            {selectedPlanning && (
              <Form.Group icon={Tag}>
                <SluglineEditable
                  key={selectedPlanning?.value}
                  compareValues={[
                    ...(selectedPlanning?.payload?.sluglines || []),
                    slugline?.toString()
                  ]}
                  path='meta.tt/slugline[0].value'
                />
                <Newsvalue />
              </Form.Group>
            )}

            {(!selectedPlanning) && (
              <Form.Group icon={Tag}>
                <SluglineEditable
                  path='meta.tt/slugline[0].value'
                />
              </Form.Group>
            )}

            <UserMessage asDialog={!!props?.asDialog}>
              {!selectedPlanning
                ? (<>Väljer du ingen planering kommer en ny planering med tillhörande uppdrag skapas åt dig.</>)
                : (<>Denna artikel kommer läggas i ett nytt uppdrag i den valda planeringen</>)}
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
                onPrimary={() => {
                  if (!provider || !props.id || !session) {
                    console.error('Environment is not sane, article cannot be created')
                    return
                  }

                  if (props?.onDialogClose) {
                    props.onDialogClose(props.id)
                  }

                  console.log(selectedPlanning)
                  createArticle({
                    provider,
                    status,
                    session,
                    planningId: selectedPlanning?.value,
                    planningTitle: planningTitleRef.current?.value,
                    wire: props.wire,
                    section: (!selectedPlanning?.value) ? section || undefined : undefined,
                    timeZone
                  })
                    .then(() => {
                      setShowVerifyDialog(false)
                      props.onDocumentCreated?.()
                    })
                    .catch((ex: unknown) => {
                      console.log(ex)
                    })
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
            <Form.Submit
              onSubmit={handleSubmit}
            >
              <Button type='submit'>Skapa artikel</Button>
            </Form.Submit>
          </Form.Footer>
        </Form.Root>
      </View.Content>
    </View.Root>
  )
}

const ValidateNow = ({ setValidateForm }: FormProps & PropsWithChildren): null => {
  useEffect(() => {
    if (setValidateForm) {
      setValidateForm(true)
    }
  }, [setValidateForm])

  return null
}
