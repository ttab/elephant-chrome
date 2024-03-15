import { Link, Avatar } from '@/components'
import { useYObserver } from '@/hooks/useYObserver'
import { AvatarGroup } from '@/components/AvatarGroup'
import { MoreHorizontal } from '@ttab/elephant-ui/icons'
import { TimeDisplay } from '@/components/DataItem/TimeDisplay'
import { PlanSlugline } from '.'
import { AssignmentType } from '@/components/DataItem/AssignmentType'

const PlanAssignment = ({ index }: { index: number }): JSX.Element => {
  const { get: getTitle } = useYObserver('planning', `meta.core/assignment[${index}]`)
  const { get: getUUID } = useYObserver('planning', `meta.core/assignment[${index}].links.core/article[0]`)
  const { get: getAssignmentDescription } = useYObserver('planning', `meta.core/assignment[${index}].meta.core/description[0].data`)
  const { get: getAssignmentPublishTime } = useYObserver('planning', `meta.core/assignment[${index}].data`)
  const { state: stateAuthor = [] } = useYObserver('planning', `meta.core/assignment[${index}].links.core/author`)

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
              : getTitle('title') as string}
          </div>
          <PlanSlugline path={`meta.core/assignment[${index}].meta.tt/slugline[0]`} />
        </div>
        <div className='font-normal text-sm mt-2'>{getAssignmentDescription('text') as string}</div>
      </div>
      <div className="col-span-4 flex justify-end space-x-4 items-center">
        <div className="">
          <AvatarGroup>
            {Array.isArray(stateAuthor) && stateAuthor.map((author, index) => {
              return <Avatar
                key={index}
                size='sm'
                value={author?.name || ''} />
            })}
          </AvatarGroup>
        </div>
        <div className="">
          <AssignmentType index={index} />
        </div>
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
  const { state } = useYObserver('planning', 'meta.core/assignment')
  return (
    <div>
      {Array.isArray(state) && state.map((_, index: number) => (
        <PlanAssignment key={index} index={index} />
      ))}
    </div>
  )
}
