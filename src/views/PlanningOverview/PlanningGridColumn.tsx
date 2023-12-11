
import { type Planning as PlanningType } from '@/components/PlanningTable/data/schema'
import { useRegistry } from '@/contexts/RegistryProvider'

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
          return <div key={item._id}>
            <strong className="font-bold">{item._source['document.title']}</strong>
            <span>{item._source['document.type']}</span>
          </div>
        })}
      </div>
    </div>
  )
}
