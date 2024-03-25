import { ViewHeader } from '@/components'
import { type ViewMetadata, type ViewProps } from '@/types'
import { ScrollArea } from '@ttab/elephant-ui'
import { GanttChartSquare } from '@ttab/elephant-ui/icons'
import { useQuery } from '@/hooks'
import { CollaborationProviderContext } from '@/contexts'
import { SluglineEditable } from '@/components/DataItem/Slugline'
import {
  PlanAssignments,
  PlanDate,
  PlanDescriptions,
  PlanSector,
  PlanStatus,
  PlanTitle,
  PlanPriority,
  PlanCategory,
  PlanStory,
  PlanDocumentStatus
} from './components'

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


export const Planning = (props: ViewProps): JSX.Element => {
  const query = useQuery()
  const planningId = props.id || query.id

  return (
    <>
      {planningId
        ? <CollaborationProviderContext documentId={planningId}>
          <PlanningViewContent {...props} />
        </CollaborationProviderContext>
        : <></>
      }
    </>
  )
}

const PlanningViewContent = (props: ViewProps): JSX.Element | undefined => {
  return (
    <div className={'flex flex-col h-screen'}>
      <div className="grow-0">
        <ViewHeader {...props} title="Planering" icon={GanttChartSquare}>
          <div className='flex w-full h-full items-center space-x-2'>
            <PlanDocumentStatus />
            <PlanStatus />
            <PlanPriority />
            <PlanTitle className='invisible @4xl:visible' />
          </div>
        </ViewHeader>
      </div>

      <ScrollArea className='grid @5xl:place-content-center'>
        <section className='overscroll-auto @5xl:w-[1024px] space-y-4 p-8'>
          <div className='flex space-x-2 items-center'>
            <PlanTitle className='font-semibold text-xl leading-4 px-0' />
            <SluglineEditable />
          </div>
          <PlanDescriptions />
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
