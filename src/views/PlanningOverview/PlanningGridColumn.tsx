
import { type Planning as PlanningType } from '@/components/PlanningTable/data/schema'
import { useRegistry } from '@/contexts/RegistryProvider'
import { SectorBadge } from '@/components/DataItem/SectorBadge'
import { StatusIndicator } from '@/components/DataItem/StatusIndicator'

interface PlanningGridColumnProps {
  date: Date
  items: PlanningType[]
}

export const PlanningGridColumn = ({ date, items }: PlanningGridColumnProps): JSX.Element => {
  const { locale, timeZone } = useRegistry()

  const [weekday, day] = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    timeZone
  }).format(date).split(' ')

  return (
    <div>
      <div className="border-b pt-3 pb-2">
        <div className="text-sm text-muted-foreground leading-tight">{weekday}</div>
        <div className="text-lg text-muted-foreground leading-tight">{day}</div>
      </div>

      <div>
        {items.map(item => {
          const internal = item._source['document.meta.core_planning_item.data.public'][0] !== 'true'
          const title = item._source['document.title'][0]
          const slugLine = item._source['document.meta.core_assignment.meta.tt_slugline.value']

          return <div key={item._id} className="">
            <StatusIndicator internal={internal} />
            <strong className="font-bold">{title}</strong>
            <span>{slugLine}</span>
            <SectorBadge value={item._source['document.rel.sector.title'][0]} />
          </div>
        })}
      </div>
    </div>
  )
}
