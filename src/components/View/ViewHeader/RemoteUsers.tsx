import { type PropsWithChildren } from 'react'
import { useAwareness } from '@/hooks'
import { AvatarGroup } from '@/components/AvatarGroup'
import { Avatar } from '@/components/Avatar'

export const RemoteUsers = ({ documentId }: PropsWithChildren & {
  documentId: string
}): JSX.Element => {
  const [states] = useAwareness(documentId)

  return (
    <div className='flex-grow flex items-center justify-end'>
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
