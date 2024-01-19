import { ViewHeader } from '@/components'
import { type ViewMetadata, type ViewProps } from '@/types'
import { ScrollArea } from '@ttab/elephant-ui'
import { GanttChartSquare } from '@ttab/elephant-ui/icons'
import { Textbit } from '@ttab/textbit'
import { useCollaboration, useQuery } from '@/hooks'
import { CollaborationProviderContext } from '@/contexts'
import { Title } from './Title'

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
    synced: isSynced,
    user
  } = useCollaboration()


  return (
    <Textbit>
      <div className={`flex flex-col h-screen ${!isSynced ? 'opacity-60' : ''}`}>
        <div className="grow-0">
          <ViewHeader {...props} title="Planering" icon={GanttChartSquare}>
          </ViewHeader>
        </div>

        <ScrollArea>
          <div className="overscroll-auto">
            <h1 className='font-bold text-lg'>id: {props.id}</h1>
            <Title isSynced document={isSynced ? provider?.document : undefined}/>
          </div>
        </ScrollArea>
      </div>
    </Textbit>
  )
}

Planning.meta = meta
