import { AwarenessDocument, ViewHeader } from '@/components'
import { type ViewMetadata, type ViewProps } from '@/types'
import { Button, ScrollArea, Separator } from '@ttab/elephant-ui'
import { GanttChartSquare } from '@ttab/elephant-ui/icons'
import { useCollaboration, useQuery } from '@/hooks'
import { SluglineEditable } from '@/components/DataItem/SluglineEditable'
import {
  AssignmentTable,
  PlanDate,
  PlanSector,
  PlanStatus,
  PlanTitle,
  PlanNewsvalue,
  PlanStory,
  PlanDocumentStatus,
  PlanDescription
} from './components'
import type * as Y from 'yjs'
import { cva } from 'class-variance-authority'
import { cn } from '@ttab/elephant-ui/utils'
import { createStateless, StatelessType } from '@/shared/stateless'
import { useSession } from 'next-auth/react'

const meta: ViewMetadata = {
  name: 'Planning',
  path: `${import.meta.env.BASE_URL || ''}/planning`,
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


export const Planning = (props: ViewProps & { document?: Y.Doc }): JSX.Element => {
  const query = useQuery()
  const documentId = props.id || query.id

  return (
    <>
      {documentId
        ? <AwarenessDocument documentId={documentId} document={props.document}>
          <PlanningViewContent {...props} documentId={documentId} />
        </AwarenessDocument>
        : <></>
      }
    </>
  )
}

const PlanningViewContent = (props: ViewProps & { documentId: string }): JSX.Element | undefined => {
  const { provider } = useCollaboration()
  const { data, status } = useSession()

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

  return (
    <div className={cn(viewVariants({ asCreateDialog: !!props.asCreateDialog, className: props?.className }))}>
      <div className="grow-0">
        <ViewHeader.Root>
          {!props.asCreateDialog &&
            <ViewHeader.Title title='Planering' icon={GanttChartSquare} iconColor='#DAC9F2' />
          }

          <ViewHeader.Content>
            <div className='flex w-full h-full items-center space-x-2'>
              <PlanDocumentStatus documentId={props.documentId} />
              <PlanStatus />
              <PlanNewsvalue />
            </div>
          </ViewHeader.Content>

          <ViewHeader.Action onDialogClose={props.onDialogClose}>
            {!props.asCreateDialog && !!props.documentId &&
              <ViewHeader.RemoteUsers documentId={props.documentId} />
            }
          </ViewHeader.Action>
        </ViewHeader.Root>
      </div>

      <ScrollArea className='grid @5xl:place-content-center'>
        <section className={cn(sectionVariants({ asCreateDialog: !!props?.asCreateDialog }))}>
          <div className='flex flex-col gap-2 pl-0.5'>
            <div className='flex space-x-2 items-start'>
              <PlanTitle autoFocus={props.asCreateDialog} />
              <SluglineEditable path='meta.tt/slugline[0].value' />
            </div>

            <PlanDescription role="public" />
            <PlanDescription role="internal" />
          </div>

          <div className="flex flex-col space-y-2">
            <div className='-ml-2'>
              <PlanDate />
            </div>
            <div className='flex space-x-2'>
              <PlanSector />
              <PlanStory />
            </div>
          </div>

          <AssignmentTable />
        </section>

        {props.asCreateDialog && (
          <div>
            <Separator className='ml-0' />
            <div className='flex justify-end px-6 py-4'>
              <Button onClick={() => {
                // Get the id, post it, and open it in a view?
                if (props?.onDialogClose) {
                  props.onDialogClose()
                }

                if (provider && status === 'authenticated') {
                  provider.sendStateless(
                    createStateless(StatelessType.IN_PROGRESS, {
                      state: false,
                      id: props.documentId,
                      context: data.accessToken
                    }))
                }
              }}>
                Skapa planering
              </Button>
            </div>
          </div>)}

      </ScrollArea>
    </div>
  )
}

Planning.meta = meta
