import { ViewHeader } from '@/components'
import { type ViewMetadata, type ViewProps } from '@/types'
import { ScrollArea, Separator } from '@ttab/elephant-ui'
import { GanttChartSquare } from '@ttab/elephant-ui/icons'
import { Textbit } from '@ttab/textbit'
import { useCollaboration, useQuery } from '@/hooks'
import { CollaborationProviderContext } from '@/contexts'
import { PlanningHeader } from './PlanningHeader'
import { PlanAssignments } from './components/PlanAssignments'
import { PlanDate } from './components/PlanDate'
import { PlanDescription } from './components/PlanDescription'
import { PlanSector } from './components/PlanSector'
import { PlanStatus } from './components/PlanStatus'
import { PlanTitle } from './components/PlanTitle'

const meta: ViewMetadata = {
  name: 'Planning',
  path: `${import.meta.env.BASE_URL || ''}/planning`,
  widths: {
    sm: 12,
    md: 12,
    lg: 6,
    xl: 6,
    '2xl': 4
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

const PlanningViewContent = (props: ViewProps): JSX.Element => {
  const {
    provider,
    synced: isSynced
  } = useCollaboration()


  const document = isSynced ? provider?.document : undefined

  return (
    <Textbit>
      <div className={`flex flex-col h-screen ${!isSynced ? 'opacity-60' : ''}`}>
        <div className="grow-0">
          <ViewHeader {...props} title="Planering" icon={GanttChartSquare}>
            <PlanningHeader isSynced={isSynced} document={document} />
          </ViewHeader>
        </div>

        <ScrollArea>
          <section className='overscroll-auto w-full space-y-4 p-8'>
            <PlanDate isSynced={isSynced} document={document} />
            <div className='flex justify-between'>
              <PlanSector isSynced={isSynced} document={document} />
              <PlanStatus isSynced={isSynced} document={document} />
            </div>
            <Separator />
            <PlanAssignments isSynced={isSynced} document={document} />
            <PlanTitle isSynced={isSynced} document={document} className='font-bold text-xl py-4' />
            <PlanDescription isSynced={isSynced} document={document} />
          </section>
        </ScrollArea>
      </div>
    </Textbit>
  )
}

Planning.meta = meta
