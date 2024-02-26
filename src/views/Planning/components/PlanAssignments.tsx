import { Link, Avatar } from '@/components'
import { Separator } from '@ttab/elephant-ui'
import { useYObserver } from '@/hooks/useYObserver'
import { AvatarGroup } from '@/components/AvatarGroup'

const PlanAssignment = ({ index }: { index: number }): JSX.Element => {
  const { get: getTitle } = useYObserver(`meta.core/assignment[${index}]`)
  const { get: getUUID } = useYObserver(`meta.core/assignment[${index}].links.core/article[0]`)
  const { state: stateAuthor = [] } = useYObserver(`meta.core/assignment[${index}].links.core/author`)

  return (
    <div className='flex flex-col'>
      <AvatarGroup>
        {Array.isArray(stateAuthor) && stateAuthor.map((author, index) => {
          return <Avatar
            key={index}
            variant="muted"
            size='sm'
            value={author?.name || ''} />
        })}
      </AvatarGroup>
      {getUUID('uuid')
        ? (
          <Link to='Editor' props={{ id: getUUID('uuid') }}>
            {getTitle('title') as string}
          </Link>)
        : getTitle('title') as string}
      <Separator className='my-4' />
    </div>
  )
}

export const PlanAssignments = (): JSX.Element => {
  const { state } = useYObserver('meta.core/assignment')
  return (
    <div>
      {Array.isArray(state) && state.map((_, index: number) => (
        <PlanAssignment key={index} index={index} />
      ))}
    </div>
  )
}
