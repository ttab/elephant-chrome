
import { type Planning as PlanningType } from '@/views/PlanningOverview/PlanningTable/data/schema'
import { useRegistry, useYMap } from '@/hooks'
import { SectorBadge } from '@/components/DataItem/SectorBadge'
import { StatusIndicator } from '@/components/DataItem/StatusIndicator'
import { getPublishTime } from '@/lib/getPublishTime'
import { dateToReadableTime } from '@/lib/datetime'
import { useContext, useEffect, useState } from 'react'
import { DocTrackerContext } from '@/contexts/DocTrackerProvider'
import type * as Y from 'yjs'

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
          const deliverables = item._source['document.meta.core_assignment.rel.deliverable.uuid']
          const deliverable = (Array.isArray(deliverables) ? deliverables[0] || '' : '')

          return <PlanningItem
            key={item._id}
            id={item._id}
            internal={internal}
            title={title}
            slugLine={slugLine}
            assignmentDataPublish={assignmentDataPublish}
            locale={locale}
            timeZone={timeZone}
            sectorBadge={item._source['document.rel.sector.title'][0]}
            deliverable={deliverable}
          />
        })}
      </div>
    </div>
  )
}


function PlanningItem(props: {
  id: string
  internal: boolean
  title: string
  slugLine: string
  assignmentDataPublish?: Date
  locale: string
  timeZone: string
  sectorBadge: string
  deliverable: string
}): JSX.Element {
  const { internal, title, slugLine, assignmentDataPublish, sectorBadge, locale, timeZone, deliverable } = props
  const { provider: docTracker } = useContext(DocTrackerContext)
  const [yUsers, , initYUsers] = useYMap(deliverable)
  const [users, setUsers] = useState<string[]>([])

  //
  // TODO: Verify that this is actually updating, does not seem like it
  // TODO: Verify that this does not cause indefinite rerenders
  //
  useEffect(() => {
    if (!docTracker?.document || !docTracker.synced) {
      return
    }

    const openDocuments = docTracker.document.getMap('documents')
    initYUsers(openDocuments)
  }, [docTracker?.document, docTracker?.synced, initYUsers])

  useEffect(() => {
    if (!yUsers || !(yUsers as Y.Map<string>)?.entries) {
      return
    }

    const locUsers = []
    for (const [key, value] of (yUsers as Y.Map<string>).entries()) {
      locUsers.push(value.toString())
    }
    setUsers(locUsers)
  }, [yUsers])

  return (
    <div className="px-3 pb-8">
      <div className="flex text-sm -ml-3">
        <div className="flex-none">
          <StatusIndicator internal={internal} />
        </div>

        <div className="flex-grow font-medium line-clamp-3">{title}</div>

        {!!assignmentDataPublish &&
          <div className="flex-none text-muted-foreground">
            {dateToReadableTime(assignmentDataPublish, locale, timeZone)}
          </div>
        }
      </div>

      <div className="flex justify-between mt-2">
        <span className="text-sm text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis pl-7 pr-1">{slugLine}</span>
        <SectorBadge value={sectorBadge} />
      </div>

      <div>
        {...users}
      </div>

    </div>
  )
}
