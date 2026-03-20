import { Tooltip } from '@ttab/elephant-ui'
import { Avatar, type AvatarSize } from '@/components'
import { AvatarGroup } from '../AvatarGroup'
import type { JSX } from 'react'

export const AssigneeAvatars = ({ assignees, size = 'sm', color = '', tooltip = true }: {
  assignees: string[]
  size?: string
  color?: string
  tooltip?: boolean
}): JSX.Element => {
  return (
    <AvatarGroup size={size as AvatarSize}>
      {(assignees || []).slice(0, 3).map((assignee: string, index: number) => {
        if (tooltip) {
          return (
            <Tooltip key={index} content={assignee}>
              <Avatar value={assignee} size={size as AvatarSize} color={color} variant={color ? 'color' : undefined} stacked={index > 0} />
            </Tooltip>
          )
        }
        return (
          <Avatar key={index} value={assignee} title={assignee} size={size as AvatarSize} color={color} variant={color ? 'color' : undefined} stacked={index > 0} />
        )
      })}

      {assignees.length > 3 && (
        <Tooltip content={
          assignees.map((assignee, index) => (
            <div key={index} className='flex p-1 text-xs font-semibold leading-7 items-center z-100'>
              <Avatar variant='muted' size='sm' value={assignee} className='mr-4' tooltip={tooltip} />
              <p>{assignee}</p>
            </div>
          ))
        }
        >
          <span className='font-semibold items-start text-muted-foreground px-4 pt-1 text-xs'>
            {assignees.length > 3 && `+${assignees.length - 3}`}
          </span>
        </Tooltip>
      )}

    </AvatarGroup>
  )
}
