import { Link } from '@/components'
import { useYObserver } from '@/hooks/useYObserver'
import { MoreHorizontal } from '@ttab/elephant-ui/icons'
import { TimeDisplay } from '@/components/DataItem/TimeDisplay'
import { SluglineEditable } from '@/components/DataItem/Slugline'
import { AssignmentType } from '@/components/DataItem/AssignmentType'
import { AssigneeAvatars } from '@/components/DataItem/AssigneeAvatars'
import type * as Y from 'yjs'

const PlanAssignment = ({ index }: { index: number }): JSX.Element => {
  const { get: getTitle } = useYObserver('meta', `core/assignment[${index}]`)
  const { get: getUUID } = useYObserver('meta', `core/assignment[${index}].links.core/article[0]`)
  const { get: getAssignmentDescription } = useYObserver('meta', `core/assignment[${index}].meta.core/description[0].data`)
  const { get: getAssignmentPublishTime } = useYObserver('meta', `core/assignment[${index}].data`)
  const { state: stateAuthor = [] } = useYObserver('meta', `core/assignment[${index}].links.core/author`)

  return (
    <div className="grid grid-cols-12 border-b py-2">
      <div className="col-span-8 px-2 py-1">
        <div className="flex-grow flex space-x-2 items-center">
          <div className='font-medium text-sm'>
            {getUUID('uuid')
              ? (
                <Link to='Editor' props={{ id: getUUID('uuid') }}>
                  {getTitle('title') as string}
                </Link>
                )
              : <span className='text-muted-foreground'>{getTitle('title') as string}</span>}
          </div>
          <SluglineEditable path={`core/assignment[${index}].meta.tt/slugline[0]`} />
        </div>
        <div className='font-normal text-sm mt-2'>{(getAssignmentDescription('text') as Y.XmlText)?.toJSON() }</div>
      </div>
      <div className="col-span-4 flex justify-end space-x-4 items-center">
        <AssigneeAvatars
          assignees={Array.isArray(stateAuthor)
            ? stateAuthor.map((author) => author.name)
            : []}
        />
        <AssignmentType index={index} />
        <div className="min-w-[64px] whitespace-nowrap">
          {getAssignmentPublishTime('publish')
            ? <TimeDisplay date={new Date(getAssignmentPublishTime('publish') as string)} />
            : '-'
          }
        </div>
        <div className="whitespace-nowrap">
          <MoreHorizontal size={18} strokeWidth={1.75} />
        </div>
      </div>
    </div>
  )
}

export const PlanAssignments = (): JSX.Element => {
  const { state } = useYObserver('meta', 'core/assignment')
  return (
    <div>
      {Array.isArray(state) && state.map((_, index: number) => (
        <PlanAssignment key={index} index={index} />
      ))}
    </div>
  )
}
