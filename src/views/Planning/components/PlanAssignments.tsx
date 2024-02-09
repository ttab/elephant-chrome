import { Link, Avatar } from '@/components'
import { Separator } from '@ttab/elephant-ui'
import { useYObserver } from '@/hooks/useYObserver'
import { AvatarGroup } from '@/components/AvatarGroup'
import type * as Y from 'yjs'

const PlanAssignment = ({ yMap }: { yMap: Y.Map<unknown> }): JSX.Element => {
  const [title] = useYObserver(yMap, 'title')

  const [authors] = useYObserver((yMap.get('links') as Y.Map<Y.Array<unknown>>)?.get('core/author'))
  const [uuid] = useYObserver((yMap?.get('links') as Y.Map<Y.Array<Y.Map<unknown>>>)?.get('core/article')?.get(0), 'uuid')

  return (
    <div className='flex flex-col'>
      <AvatarGroup>
        {authors.map((author, index) => {
          const name = (author as Y.Map<string>).get('name')
          return <Avatar
            key={index}
            variant="muted"
            size='sm'
            value={name || ''} />
        })}
      </AvatarGroup>
      {uuid
        ? (
          <Link to='Editor' props={{ id: uuid }}>
            {title}
          </Link>)
        : title}
      <Separator className='my-4' />
    </div>)
}
export const PlanAssignments = ({ yArray }: { yArray?: Y.Array<Y.Map<unknown>> }): JSX.Element => {
  return (
    <div>
      {(yArray || []).map((yMap, index: number) => (
        <PlanAssignment key={index} yMap={yMap} />
      ))}
    </div>
  )
}
