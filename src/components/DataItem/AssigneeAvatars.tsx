import {
  Tooltip
} from '@ttab/elephant-ui'
import { Avatar } from '@/components'
import { AvatarGroup } from '../AvatarGroup'

export const AssigneeAvatars = ({ assignees }: { assignees: string[] }): JSX.Element => {
  return (
    <AvatarGroup size='sm'>
      {(assignees || []).slice(0, 3).map((assignee: string, index: number) => {
        return (
          <Tooltip key={index} content={assignee}>
            <Avatar value={assignee} size='sm' stacked={index > 0} />
          </Tooltip>
        )
      })}

      {assignees.length > 3 && (
        <Tooltip content={
          assignees.map((assignee, index) => (
            <div key={index} className='flex p-1 text-xs font-semibold leading-7 items-center'>
              <Avatar variant='muted' size='sm' value={assignee} className='mr-4' />
              <p>{assignee}</p>
            </div>))
        }>
          <span className='font-semibold text-muted-foreground px-4 pt-1'>
            {assignees.length > 3 && `+${assignees.length - 3}`}
          </span>
        </Tooltip>)
      }
    </AvatarGroup>
  )
}
