import {
  AwarenessDocument,
  ViewHeader,
  Title,
  Awareness,
  Byline
} from '@/components'
import type { DefaultValueOption, ViewMetadata, ViewProps } from '@/types'
import { NewsvalueMap } from '@/defaults'
import { Button, ComboBox, ScrollArea, Separator, Alert, AlertDescription } from '@ttab/elephant-ui'
import { CircleXIcon, GanttChartSquareIcon, TagsIcon, ZapIcon, InfoIcon } from '@ttab/elephant-ui/icons'
import { useCollaboration, useQuery, useYValue, useIndexUrl, useRegistry } from '@/hooks'

import * as Y from 'yjs'
import { cva } from 'class-variance-authority'
import { cn } from '@ttab/elephant-ui/utils'
import { createStateless, StatelessType } from '@/shared/stateless'
import { useSession } from 'next-auth/react'
import { useRef, useState } from 'react'
import { type Planning, Plannings } from '@/lib/index'
import { convertToISOStringInTimeZone, convertToISOStringInUTC, getDateTimeBoundaries } from '@/lib/datetime'
import { FlashEditor } from './FlashEditor'
import { useCollaborationDocument } from '@/hooks/useCollaborationDocument'
import { getValueByYPath } from '@/lib/yUtils'
import { YBlock } from '@/shared/YBlock'
import { toYMap } from '../../../src-srv/utils/transformations/lib/toYMap'
import { createDocument } from '@/lib/createYItem'
import * as Templates from '@/defaults/templates'
import { isYMap } from '@/lib/isType'

const meta: ViewMetadata = {
  name: 'Flash',
  path: `${import.meta.env.BASE_URL || ''}/flash`,
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

interface DefaultPlanningItem {
  uuid: string,
  title: string
}


export const Flash = (props: ViewProps & {
  document?: Y.Doc,
  defaultPlanningItem?: DefaultPlanningItem
}): JSX.Element => {
  const query = useQuery()
  const documentId = props.id || query.id

  return (
    <>
      {documentId
        ? <AwarenessDocument documentId={documentId} document={props.document}>
          <FlashViewContent {...props} documentId={documentId} defaultPlanningItem={props.defaultPlanningItem} />
        </AwarenessDocument>
        : <></>
      }
    </>
  )
}

const FlashViewContent = (props: ViewProps & {
  documentId: string,
  defaultPlanningItem?: DefaultPlanningItem
}): JSX.Element | undefined => {
  const { provider } = useCollaboration()
  const { status, data: session } = useSession()
  const indexUrl = useIndexUrl()
  const { timeZone } = useRegistry()
  const planningAwareness = useRef<(value: boolean) => void>(null)
  const [selectedOptions, setSelectedOptions] = useState<DefaultValueOption[]>(props.defaultPlanningItem
    ? [{
      value: props.defaultPlanningItem.uuid,
      label: props.defaultPlanningItem.title
    }]
    : []
  )
  const [title] = useYValue<string | undefined>('title')

  const { document: planningDocument } = useCollaborationDocument({
    documentId: selectedOptions?.[0]?.value,
    initialDocument: !selectedOptions?.[0]?.value
      ? createDocument(Templates.planning, true, {})[1]
      : undefined
  })

  //  Helper function to search for planning items.
  const fetchAsyncData = async (str: string): Promise<DefaultValueOption[]> => {
    if (!session || !indexUrl) {
      return []
    }

    const { startTime, endTime } = getDateTimeBoundaries(new Date())
    const result = await Plannings.search(indexUrl, session.accessToken, {
      size: 100,
      where: {
        start: convertToISOStringInUTC(startTime),
        end: convertToISOStringInUTC(endTime),
        text: str
      }
    })

    if (!result.ok) {
      return []
    }

    const newOptions = result.hits.map((planning: Planning) => {
      const id = planning._id
      const title = planning._source['document.title']?.[0]
      const newsvalue = NewsvalueMap[planning._source['document.meta.core_newsvalue.value']?.[0]]

      const info = [
        planning._source['document.meta.tt_slugline.value']?.[0],
        planning._source['document.rel.section.title']?.[0]
      ].filter(v => v).join(', ')

      return {
        value: id,
        label: title,
        info: info ? ` - ${info}` : '',
        icon: newsvalue.icon,
        iconProps: newsvalue.iconProps
      }
    })

    return newOptions
  }

  const viewVariants = cva('flex flex-col', {
    variants: {
      asCreateDialog: {
        false: 'h-screen',
        true: 'overflow-hidden'
      }
    }
  })

  const sectionVariants = cva('overscroll-auto @5xl:w-[1024px] space-y-4', {
    variants: {
      asCreateDialog: {
        false: 'px-8',
        true: 'px-6'
      }
    }
  })

  return (
    <div className={cn(viewVariants({ asCreateDialog: !!props.asDialog, className: props?.className }))}>
      <div className="grow-0">
        <ViewHeader.Root>
          {!props.asDialog &&
            <ViewHeader.Title title='Flash' icon={ZapIcon} iconColor='#FF5150' />
          }

          <ViewHeader.Content>
            <div className='flex w-full h-full items-center space-x-2 font-bold'>
              <ViewHeader.Title title='Flash' icon={ZapIcon} iconColor='#FF3140' />
            </div>
          </ViewHeader.Content>

          <ViewHeader.Action onDialogClose={props.onDialogClose}>
            {!props.asDialog && !!props.documentId &&
              <ViewHeader.RemoteUsers documentId={props.documentId} />
            }
          </ViewHeader.Action>
        </ViewHeader.Root>
      </div>

      <ScrollArea className='grid @5xl:place-content-center'>
        <div className="space-y-5 py-5">
          <section className={cn(sectionVariants({ asCreateDialog: !!props?.asDialog }))}>
            <div className="ps-1">
              <Title
                autoFocus={props.asDialog}
                placeholder='Rubrik'
              />
            </div>

            <div className="flex flex-row gap-5 items-center">
              <div>
                <GanttChartSquareIcon size={18} strokeWidth={1.75} className='text-muted-foreground' />
              </div>

              <div className="flex flex-row items-center gap-2">
                <Awareness name="FlashPlanningItem" ref={planningAwareness}>
                  <ComboBox
                    max={1}
                    size='xs'
                    className='min-w-0 max-w-46 truncate justify-start'
                    selectedOptions={selectedOptions}
                    placeholder={'Välj planering'}
                    onOpenChange={(isOpen: boolean) => {
                      if (planningAwareness?.current) {
                        planningAwareness.current(isOpen)
                      }
                    }}
                    fetch={fetchAsyncData}
                    minSearchChars={2}
                    onSelect={(option) => {
                      setSelectedOptions(option ? [option as DefaultValueOption] : [])
                    }}
                  ></ComboBox>
                </Awareness>

                {!!setSelectedOptions?.length &&
                  <Button
                    variant='ghost'
                    className="text-muted-foreground flex h-7 w-7 p-0 data-[state=open]:bg-muted hover:bg-accent2"
                    onClick={(e) => {
                      e.preventDefault()
                      setSelectedOptions([])
                    }}
                  >
                    <CircleXIcon size={18} strokeWidth={1.75} />
                  </Button>
                }
              </div>
            </div>

            <div className="flex flex-row gap-5 items-center">
              <div className="pt-1">
                <TagsIcon size={18} strokeWidth={1.75} className='text-muted-foreground' />
              </div>

              <Byline name='FlashByline' />
            </div>
          </section>

          <section className={cn(sectionVariants({ asCreateDialog: !!props?.asDialog }), 'px-0')}>
            <FlashEditor />
          </section>

          <section className={cn(sectionVariants({ asCreateDialog: !!props?.asDialog }))}>
            <Alert className='bg-gray-50'>
              <InfoIcon size={18} strokeWidth={1.75} className='text-muted-foreground' />
              <AlertDescription>
                {!selectedOptions?.length
                  ? <>Väljer du ingen planering kommer en ny planering med tillhörande uppdrag skapas åt dig.</>
                  : <>Denna flash kommer läggas i ett nytt uppdrag i den valda planeringen</>
                }
              </AlertDescription>
            </Alert>
          </section>
        </div>

        {props.asDialog && (
          <div>
            <Separator className='ml-0' />
            <div className='flex justify-end px-6 py-4'>
              <Button onClick={(): void => {
                if (props?.onDialogClose) {
                  props.onDialogClose(props.documentId, title)
                }

                if (provider && status === 'authenticated') {
                  // First and foremost we persist the flash, it needs an assignment
                  const assignmentId = crypto.randomUUID()
                  addAssignmentLinkToFlash(provider.document, assignmentId)

                  provider.sendStateless(
                    createStateless(StatelessType.IN_PROGRESS, {
                      state: false,
                      id: props.documentId,
                      context: {
                        accessToken: session.accessToken
                      }
                    })
                  )

                  // Next we add it to an assignment in a planning.
                  try {
                    if (planningDocument) {
                      const planningId = addFlashToPlanning(provider.document, planningDocument, assignmentId, timeZone)

                      provider.sendStateless(
                        createStateless(StatelessType.IN_PROGRESS, {
                          state: false,
                          id: planningId,
                          context: {
                            accessToken: session.accessToken
                          }
                        })
                      )

                    } else {
                      throw new Error(`Failed adding flash ${props.documentId} - ${title} to a planning`)
                    }
                  } catch (err) {
                    // We won't let errors interfere with the publishing of the flash.
                    console.error(err)
                  }
                }
              }}>
                Skapa flash
              </Button>
            </div>
          </div>)
        }

      </ScrollArea >
    </div >
  )
}

Flash.meta = meta


function addAssignmentLinkToFlash(flashDoc: Y.Doc, assignmentId: string): void {
  const flash = flashDoc.getMap('ele') as Y.Map<unknown>
  const [flashLinks] = getValueByYPath<Y.Map<Y.Array<unknown>>>(flash, 'links', true)

  if (!flashLinks) {
    throw new Error('Flash document is missing links array, could not create flash')
  }

  const assignmentLink = toYMap(
    YBlock.create({
      type: 'core/assignment',
      rel: 'assignment',
      uuid: assignmentId
    })[0] as unknown as Record<string, unknown>
  )

  const assignmentLinks = new Y.Array()
  assignmentLinks.push([assignmentLink])
  flashLinks.set('core/assignment', assignmentLinks)
}


function addFlashToPlanning(flashDoc: Y.Doc, planningDoc: Y.Doc, assignmentId: string, timeZone: string): string {
  const flash = flashDoc.getMap('ele') as Y.Map<unknown>
  const [flashId] = getValueByYPath<string>(flash, 'root.uuid')
  const [flashTitle] = getValueByYPath<string>(flash, 'root.title')

  const [flashSection] = getValueByYPath<Y.Map<unknown>>(flash, 'links.core/section[0]')

  const planning = planningDoc.getMap('ele') as Y.Map<unknown>
  const [planningTitle, planningRoot] = getValueByYPath<string>(planning, 'root.title')


  if (!flashId || !flashTitle || !flashSection) {
    throw new Error('Id, title and section is missing on new flash')
  }

  if (!isYMap(planningRoot)) {
    throw new Error('Planning document is faulty, no root Y.Map exists')
  }

  // If no planning title exists this is a new planning
  if (!planningTitle) {
    (planningRoot as Y.Map<unknown>).set('title', flashTitle)

    const planningSections = new Y.Array()
    planningSections.push([flashSection.clone()])

    const [planningLinks] = getValueByYPath<Y.Map<Y.Array<unknown>>>(planning, 'links', true)
    planningLinks?.set('core/section', planningSections)
  }

  // Create assignment (using given assignment id)
  const dt = new Date()
  const zuluISODate = `${new Date().toISOString().split('.')[0]}Z` // Remove ms, add Z back again
  const localISODateTime = convertToISOStringInTimeZone(dt, timeZone).slice(0, 10)

  const eleAssignment = YBlock.create({
    id: assignmentId,
    type: 'core/assignment',
    title: flashTitle,
    data: {
      full_day: 'false',
      start_date: localISODateTime,
      end_date: localISODateTime,
      start: zuluISODate,
      end: zuluISODate,
      public: 'true',
      publish: zuluISODate
    },
    meta: [
      {
        type: 'core/assignment-type',
        value: 'flash'
      },
      {
        type: 'core/description',
        data: {
          text: ''
        }
      }
    ],
    links: [{
      type: 'core/flash',
      rel: 'deliverable',
      uuid: flashId
    }]
  })

  const yAssignment = toYMap(eleAssignment[0] as unknown as Record<string, unknown>)

  const [yAssignments] = getValueByYPath(planning, 'meta.core/assignment', true)
  if (yAssignments) {
    (yAssignments as Y.Array<Y.Map<unknown>>).push([yAssignment])
  } else {
    const yMeta = planning.get('meta') as Y.Map<unknown>
    const newYAssignments = new Y.Array()

    newYAssignments.push([yAssignment])
    yMeta.set('core/assignment', newYAssignments)
  }

  // Add assignees from flash authors
  const [links] = getValueByYPath<Y.Map<unknown>>(yAssignment, 'links', true)
  const [flashAuthors] = getValueByYPath<Y.Array<Y.Map<unknown>>>(flash, 'links.core/author', true)

  if (links && flashAuthors) {
    const assignees = new Y.Array() as Y.Array<Y.Map<unknown>>
    links.set('core/author', assignees)

    flashAuthors.forEach(author => {
      const eleAssignee = YBlock.create({
        type: 'core/author',
        rel: 'assignee',
        role: 'primary',
        uuid: author.get('uuid') as string,
        name: (author.get('title') as Y.XmlText).toJSON() as string, // FIXME: Use title for both when repo schema is fixed
      })

      const assignee = toYMap(eleAssignee[0] as unknown as Record<string, unknown>)

      assignees.push([assignee])
    })


  }

  return getValueByYPath<string>(planning, 'root.uuid')?.[0] || ''
}
