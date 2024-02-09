import { ViewHeader } from '@/components'
import { type ViewMetadata, type ViewProps } from '@/types'
import { ScrollArea, Separator } from '@ttab/elephant-ui'
import { GanttChartSquare } from '@ttab/elephant-ui/icons'
import { Textbit } from '@ttab/textbit'
import { useCollaboration, useQuery } from '@/hooks'
import { CollaborationProviderContext } from '@/contexts'
import { PlanAssignments } from './components/PlanAssignments'
import { PlanDate } from './components/PlanDate'
import { PlanDescriptions } from './components/PlanDescriptions'
import { PlanSector } from './components/PlanSector'
import { PlanStatus } from './components/PlanStatus'
import { PlanTitle } from './components/PlanTitle'
import { PlanPriority } from './components/PlanPriority'
import type * as Y from 'yjs'

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

const PlanningViewContent = (props: ViewProps): JSX.Element | undefined => {
  const {
    provider,
    synced: isSynced
  } = useCollaboration()


  const document = isSynced ? provider?.document : undefined
  const yPlanning = document?.getMap<Y.Map<Y.Array<Y.Map<unknown>>>>('planning')
  const yMeta = yPlanning?.get('meta')
  const yLinks = yPlanning?.get('links')
  const yRoot = yPlanning?.get('root')

  return yMeta && (
    <Textbit>
      <div className={`flex flex-col h-screen ${!isSynced ? 'opacity-60' : ''}`}>
        <div className="grow-0">
          <ViewHeader {...props} title="Planering" icon={GanttChartSquare}>
            <div className='flex w-full h-full'>
              <PlanPriority yMap={yMeta?.get('core/planning-item')?.get(0)} />
              <PlanTitle yMap={yRoot as Y.Map<unknown>} />
            </div>
          </ViewHeader>
        </div>

        <ScrollArea>
          <section className='overscroll-auto w-full space-y-4 p-8'>
            <PlanDate yMap={yMeta?.get('core/planning-item')?.get(0)} />

            <div className='flex justify-between'>
              <PlanSector yMap={yLinks?.get('tt/sector')?.get(0)} />
              <PlanStatus yMap={yMeta?.get('core/planning-item')?.get(0)} />
            </div>
            <Separator />
            <PlanAssignments yArray={yMeta?.get('core/assignment')} />
            <PlanTitle yMap={yRoot as Y.Map<unknown>} />
            <PlanDescriptions yArray={yMeta?.get('core/description') as Y.Array<unknown>} />
          </section>
        </ScrollArea>
      </div>
    </Textbit>
  )
}

Planning.meta = meta
