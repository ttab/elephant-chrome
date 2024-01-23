import { useEffect } from 'react'
import { Link, Avatar } from '@/components'
import { useYMap } from '@/hooks'
import { type CollabComponentProps } from '@/types'
import { Separator } from '@ttab/elephant-ui'
import { type YMap } from 'node_modules/yjs/dist/src/internals'
import { type Block } from '../../../../src-srv/protos/service'

export const PlanAssignments = ({ isSynced, document }: CollabComponentProps): JSX.Element => {
  const [assignments, , initAssignments] = useYMap('core/assignments')

  useEffect(() => {
    if (!isSynced || !document) {
      return
    }

    const planningYMap: YMap<unknown> = document.getMap('planning')
    initAssignments(planningYMap)
  }, [
    isSynced,
    document,
    initAssignments
  ])

  return (
    <div>
      {(assignments as Block[] || []).map((assignment, index: number) => {
        const author = assignment?.links.find((a: Block) => a.type === 'core/author')?.name?.replace('/TT', '') || ''
        const uuid = assignment?.links.find((l: Block) => l.type === 'core/article')?.uuid

        return (
          <div key={index} className='flex flex-col'>
            <div className='flex space-x-1'>
              <Avatar variant='plan' size='sm' value={author} />
              <span className='text-sm font-medium leading-8'>{author}</span>
            </div>
            {uuid
              ? (
                <Link to='Editor' props={{ id: uuid }}>
                  {assignment.title}
                </Link>)
              : assignment.title}
            <Separator className='my-4'/>
          </div>)
      })}
    </div>
  )
}
