import { type PropsWithChildren } from 'react'
import { AvatarGroup } from '@/components/AvatarGroup'
import { Avatar } from '@/components/Avatar'
import { useYAwareness, type YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'

export const RemoteUsers = ({ ydoc }: PropsWithChildren & {
  ydoc: YDocument<Y.Map<unknown>>
}): JSX.Element => {
  const [states] = useYAwareness(ydoc, ydoc.id)

  return (
    <div className='grow flex items-center justify-end'>
      <AvatarGroup>
        {states.map((user) => {
          return (
            <Avatar
              key={user.clientId}
              value={user.data?.name || ''}
              variant='color'
              color={user.data?.color}
              size='sm'
            />
          )
        })}
      </AvatarGroup>
    </div>
  )
}
