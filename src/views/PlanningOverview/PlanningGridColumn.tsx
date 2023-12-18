
import { type Planning as PlanningType } from '@/components/PlanningTable/data/schema'
import { useRegistry } from '@/hooks'
import { SectorBadge } from '@/components/DataItem/SectorBadge'
import { StatusIndicator } from '@/components/DataItem/StatusIndicator'
import { getPublishTime } from '@/lib/getPublishTime'
import { dateToReadableTime } from '@/lib/datetime'

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
      <div className="border-b pt-3 pb-2 px-3">
        <div className="text-sm text-muted-foreground leading-tight">{weekday}</div>
        <div className="text-lg text-muted-foreground leading-tight">{day}</div>
      </div>

      <div className="border-r h-full flex flex-col py-4">
        {items.map(item => {
          const internal = item._source['document.meta.core_planning_item.data.public'][0] !== 'true'
          const title = item._source['document.title'][0]
          const slugLines = item._source['document.meta.core_assignment.meta.tt_slugline.value']
          const slugLine = Array.isArray(slugLines) ? slugLines[0] : slugLines
          const assignmentDataPublish = getPublishTime(item._source['document.meta.core_assignment.data.publish'])

          const startTime = assignmentDataPublish
            ? dateToReadableTime(assignmentDataPublish, locale, timeZone)
            : null

          return <div key={item._id} className="px-3 pb-8">
            <div className="flex text-sm -ml-3">
              <div className="flex-none">
                <StatusIndicator internal={internal} />
              </div>

              <div className="flex-grow font-medium line-clamp-3">{title}</div>

              {!!startTime &&
                <div className="flex-none text-muted-foreground">{startTime}</div>
              }
            </div>

            <div className="flex justify-between mt-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis pl-7 pr-1">{slugLine}</span>
              <SectorBadge value={item._source['document.rel.sector.title'][0]} />
            </div>
          </div>
        })}
      </div>
    </div>
  )
}
