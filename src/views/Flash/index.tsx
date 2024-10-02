import {
  AwarenessDocument,
  ViewHeader,
  DocumentStatus,
  VisibilityStatus,
  Newsvalue,
  Title,
  Section,
  Awareness
} from '@/components'
import { DefaultValueOption, type ViewMetadata, type ViewProps } from '@/types'
import { NewsvalueMap } from '@/defaults'
import { Button, ComboBox, ScrollArea, Separator } from '@ttab/elephant-ui'
import { CalendarDaysIcon, TagsIcon, ZapIcon } from '@ttab/elephant-ui/icons'
import {
  useCollaboration,
  useQuery,
  useYValue,
  useDocumentStatus,
  useIndexUrl
} from '@/hooks'

import type * as Y from 'yjs'
import { cva } from 'class-variance-authority'
import { cn } from '@ttab/elephant-ui/utils'
import { createStateless, StatelessType } from '@/shared/stateless'
import { useSession } from 'next-auth/react'
import { Assignees } from '@/components/Assignees'
import { useRef, useState } from 'react'
import { Planning, Plannings } from '@/lib/index'
import { convertToISOStringInUTC, getDateTimeBoundaries } from '@/lib/datetime'
import { EleBlock } from '@/shared/types'
import { YBlock } from '@/shared/YBlock'

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


export const Flash = (props: ViewProps & { document?: Y.Doc }): JSX.Element => {
  const query = useQuery()
  const documentId = props.id || query.id

  return (
    <>
      {documentId
        ? <AwarenessDocument documentId={documentId} document={props.document}>
          <FlashViewContent {...props} documentId={documentId} />
        </AwarenessDocument>
        : <></>
      }
    </>
  )
}

const FlashViewContent = (props: ViewProps & { documentId: string }): JSX.Element | undefined => {
  const { provider } = useCollaboration()
  const { status, data: session } = useSession()
  const indexUrl = useIndexUrl()
  const planningAwareness = useRef<(value: boolean) => void>(null)

  // const [planningItemUuid, setPlanningItemUiid] = useYValue<string>('links.core/planning-item[0].uuid')
  // const [planningItemTitle, setPlanningItemTitle] = useYValue<string>('links.core/planning-item[0].title')
  const [planningItems, setPlanningItems] = useYValue<EleBlock[] | undefined>('links.core/planning-item')
  const [selectedOption, setSelectedOption] = useState()

  console.log(provider?.document.toJSON())
  console.log(planningItems)

  /*
   *  Helper function to search for planning items.
   */
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

  const sectionVariants = cva('overscroll-auto @5xl:w-[1024px] space-y-5', {
    variants: {
      asCreateDialog: {
        false: 'p-8',
        true: 'p-6'
      }
    }
  })

  const [title] = useYValue<string | undefined>('title')

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
        <section className={cn(sectionVariants({ asCreateDialog: !!props?.asDialog }))}>
          <div className='flex flex-col gap-2 pl-0.5'>
            <Title
              autoFocus={props.asDialog}
              placeholder='Rubrik'
            />
          </div>

          <div className="flex flex-row items-center">
            <div className="flex flex-row gap-5">
              <div className="pt-1">
                <CalendarDaysIcon size={18} strokeWidth={1.75} />
              </div>

              <Awareness name="FlashPlanningItem" ref={planningAwareness}>
                <ComboBox
                  max={1}
                  size='xs'
                  selectedOptions={!planningItems?.length
                    ? []
                    : [{
                      value: planningItems[0].uuid,
                      label: planningItems[0].title
                    }]
                  }
                  placeholder={'Välj planering'}
                  onOpenChange={(isOpen: boolean) => {
                    if (planningAwareness?.current) {
                      planningAwareness.current(isOpen)
                    }
                  }}
                  fetch={fetchAsyncData}
                  minSearchChars={2}
                  onSelect={(option) => {
                    setPlanningItems(YBlock.create({
                      type: 'core/planning-item',
                      uuid: option.value,
                      title: option.label
                    }))
                  }}
                ></ComboBox>
              </Awareness>
            </div>
          </div>

          <div className="flex flex-row items-center">
            <div className="flex flex-row gap-5">
              <div className="pt-1">
                <TagsIcon size={18} strokeWidth={1.75} />
              </div>

              <Section />

              <Assignees
                path='links.core/author'
                name='FlashAssignees'
                placeholder='Byline'
              />
            </div>
          </div>
        </section>

        {props.asDialog && (
          <div>
            <Separator className='ml-0' />
            <div className='flex justify-end px-6 py-4'>
              <Button onClick={(): void => {
                // Get the id, post it, and open it in a view?
                if (props?.onDialogClose) {
                  props.onDialogClose(props.documentId, title)
                }

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
    </div>
  )
}

Flash.meta = meta
