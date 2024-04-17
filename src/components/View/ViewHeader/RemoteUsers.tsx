import { type PropsWithChildren } from 'react'
import { type AwarenessStates } from '@/contexts/CollaborationProvider'
import { useAwareness } from '@/hooks'
import { AvatarGroup } from '@/components/AvatarGroup'
import { Avatar } from '@/components/Avatar'

export const RemoteUsers = ({ documentId }: PropsWithChildren & {
  documentId: string
}): JSX.Element => {
  const [states] = useAwareness(documentId)

  const users = states.reduce<AwarenessStates>((remoteUsers, state) => {
    if (!remoteUsers.find(ru => ru.clientId === state.clientId)) {
      remoteUsers.push({
        clientId: state.clientId,
        data: state.data
      })
    }

    return remoteUsers
  }, [])

  return (
    <div className="flex-grow flex items-center justify-end">
      <AvatarGroup>
        {users.map(user => {
          return <Avatar
            key={user.clientId}
            value={user.data.name}
            variant="color"
            color={user.data.color}
          />
        })}
      </AvatarGroup>
    </div>
  )
}
