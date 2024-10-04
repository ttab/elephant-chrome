import {
  AwarenessDocument,
  ViewHeader,
  Title,
  Section,
  Awareness
} from '@/components'
import type { DefaultValueOption, ViewMetadata, ViewProps } from '@/types'
import { NewsvalueMap } from '@/defaults'
import { Button, ComboBox, ScrollArea, Separator, Alert, AlertDescription } from '@ttab/elephant-ui'
import { CircleXIcon, GanttChartSquareIcon, TagsIcon, ZapIcon, InfoIcon } from '@ttab/elephant-ui/icons'
import { useCollaboration, useQuery, useYValue, useIndexUrl } from '@/hooks'

import type * as Y from 'yjs'
import { cva } from 'class-variance-authority'
import { cn } from '@ttab/elephant-ui/utils'
import { createStateless, StatelessType } from '@/shared/stateless'
import { useSession } from 'next-auth/react'
import { Assignees } from '@/components/Assignees'
import { useRef, useState } from 'react'
import { type Planning, Plannings } from '@/lib/index'
import { convertToISOStringInUTC, getDateTimeBoundaries } from '@/lib/datetime'
import { FlashEditor } from './FlashEditor'
import { useCollaborationDocument } from '@/hooks/useCollaborationDocument'

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
  const planningAwareness = useRef<(value: boolean) => void>(null)
  const [selectedOptions, setSelectedOptions] = useState<DefaultValueOption[]>(props.defaultPlanningItem
    ? [{
      value: props.defaultPlanningItem.uuid,
      label: props.defaultPlanningItem.title
    }]
    : []
  )
  const [title] = useYValue<string | undefined>('title')
  const { document: planningDocument } = useCollaborationDocument({ documentId: selectedOptions?.[0]?.value })

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
                    className='max-w-96 truncate justify-start'
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

              <Section />

              <Assignees
                path='links.core/author'
                name='FlashAssignees'
                placeholder='Byline'
              />
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
                // Get the id, post it, and open it in a view?
                if (props?.onDialogClose) {
                  props.onDialogClose(props.documentId, title)
                }

                // TODO: Use planningDocument and add assignment and flash

                // TODO: Open planningDocument in a new view

                if (provider && status === 'authenticated') {
                  provider.sendStateless(
                    createStateless(StatelessType.IN_PROGRESS, {
                      state: false,
                      id: props.documentId,
                      context: {
                        accessToken: session.accessToken
                      }
                    })
                  )
                }
              }}>
                Skapa flash
              </Button>
            </div>
          </div>)}

      </ScrollArea>
    </div >
  )
}

Flash.meta = meta
