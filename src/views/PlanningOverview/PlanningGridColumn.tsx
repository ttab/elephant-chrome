import { useContext, useEffect, useState } from 'react'
import { type Planning as PlanningType } from '@/lib/index'
import { useRegistry, useSections } from '@/hooks'
import { SectionBadge } from '@/components/DataItem/SectionBadge'
import { StatusIndicator } from '@/components/DataItem/StatusIndicator'
import { DocTrackerContext } from '@/contexts/DocTrackerProvider'
import { Avatar } from '@/components'
import { AvatarGroup } from '@/components/AvatarGroup'
import type * as Y from 'yjs'
import { type IDBSection } from 'src/datastore/types'

interface PlanningGridColumnProps {
  date: Date
  items: PlanningType[]
}


interface TrackedUser {
  userId: string
  userName: string
  count: number
  socketId: string
}

type UserDoc = Record<string, Record<string, TrackedUser>>

export const PlanningGridColumn = ({ date, items }: PlanningGridColumnProps): JSX.Element => {
  const { provider: docTracker } = useContext(DocTrackerContext)
  const [openDocuments, setOpenDocuments] = useState<Y.Map<unknown> | undefined>()
  const [users, setUsers] = useState<UserDoc | undefined>()
  const sections = useSections()

  // TODO: Temporary until we'll get it into useYObserver/useCollaboration
  useEffect(() => {
    const ymap = docTracker?.document.getMap('open-documents')
    setOpenDocuments(ymap)
    setUsers(ymap?.toJSON())
  }, [docTracker?.document])

  useEffect(() => {
    openDocuments?.observe((event) => {
      setUsers(event.currentTarget.toJSON() as UserDoc | undefined)
    })
  }, [openDocuments])

  const { locale, timeZone } = useRegistry()

  const [weekday, day] = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    timeZone
  }).format(date).split(' ')

  return (
    <div>
      <div className="border-b pt-3 pb-3 px-3">
        <div className="text-sm text-muted-foreground leading-tight">{weekday}</div>
        <div className="text-lg text-muted-foreground leading-tight">{day}</div>
      </div>

      <div className="border-r h-full flex flex-col p-4 gap-8">
        {items.map(item => {
          const visibility = item._source['document.meta.core_planning_item.data.public'][0] === 'true' ? 'public' : 'internal'
          const title = item._source['document.title'][0]
          const slugLines = item._source['document.meta.core_assignment.meta.tt_slugline.value']
          const slugLine = Array.isArray(slugLines) ? slugLines[0] : slugLines
          const deliverables = item._source['document.meta.core_assignment.rel.deliverable.uuid']
          const deliverable = (Array.isArray(deliverables) ? deliverables[0] || '' : '')
          const id = item._id
          const section = sections.find((section) => section.id === item._source['document.rel.section.uuid'][0])
          const activeUsers = users?.[deliverable]

          return <PlanningItem
            key={id}
            id={id}
            visibility={visibility}
            title={title}
            slugLine={slugLine}
            section={section}
            users={activeUsers}
          />
        })
        }
      </div>
    </div>
  )
}


function PlanningItem(props: {
  id: string
  visibility: 'public' | 'internal'
  title: string
  slugLine: string
  section?: IDBSection
  users?: Record<string, TrackedUser>
}): JSX.Element {
  const { visibility, title, slugLine, section, users } = props

  return (
    <div className="flex gap-2">
      <StatusIndicator visibility={visibility} className="pt-0.5 flex-none" />

      <div className="flex flex-col w-full gap-2">
        <div className="font-medium text-sm line-clamp-3">
          {title}
        </div>

        <div className="flex justify-between gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">{slugLine}</span>
          {!!section &&
            <SectionBadge title={section.title} />
          }
        </div>

        <div className='flex'>
          <AvatarGroup>
            {Object.keys(users || {}).map(user => {
              return <span
                key={users?.[user].userName}
                title={`${users?.[user].userName} (${users?.[user].count})`}
              >
                <Avatar size="sm" variant="muted" value={users?.[user].userName || ''} />
              </span>
            })}
          </AvatarGroup>
        </div>
      </div>
    </div >
  )
}
