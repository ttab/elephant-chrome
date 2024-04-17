import { AwarenessDocument, ViewHeader } from '@/components'
import { type ViewMetadata, type ViewProps } from '@/types'
import { ScrollArea } from '@ttab/elephant-ui'
import { GanttChartSquare } from '@ttab/elephant-ui/icons'
import { useQuery } from '@/hooks'
import { SluglineEditable } from '@/components/DataItem/Slugline'
import {
  PlanAssignments,
  PlanDate,
  PlanSector,
  PlanStatus,
  PlanTitle,
  PlanPriority,
  PlanCategory,
  PlanStory,
  PlanDocumentStatus,
  PlanDescription
} from './components'
import type * as Y from 'yjs'
import { cva } from 'class-variance-authority'
import { cn } from '@ttab/elephant-ui/utils'

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
  const viewVariants = cva('flex flex-col', {
    variants: {
      asDialog: {
        false: 'h-screen',
        true: 'overflow-hidden'
      }
    }
  })

  const sectionVariants = cva('overscroll-auto @5xl:w-[1024px] space-y-4', {
    variants: {
      asDialog: {
        false: 'p-8',
        true: 'p-6'
      }
    }
  })

  return (
    <div className={cn(viewVariants({ asDialog: !!props.asDialog, className: props?.className }))}>
      <div className="grow-0">
        <ViewHeader.Root>
          {!props.asDialog &&
            <ViewHeader.Title title='Planering' icon={GanttChartSquare} />
          }

          <ViewHeader.Content>
            <div className='flex w-full h-full items-center space-x-2'>
              <PlanDocumentStatus />
              <PlanStatus />
              <PlanPriority />
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
        <section className={cn(sectionVariants({ asDialog: !!props?.asDialog }))}>
          <div className='flex space-x-2 items-center'>
            <PlanTitle />
            <SluglineEditable />
          </div>

          <div className='flex flex-col gap-4'>
            <PlanDescription role="public" />
            <PlanDescription role="internal" />
          </div>

          <PlanDate />

          <div className='flex space-x-2'>
            <PlanSector />
            <PlanCategory />
            <PlanStory />
          </div>

          <PlanAssignments />
        </section>
      </ScrollArea>
    </div>
  )
}

Planning.meta = meta
