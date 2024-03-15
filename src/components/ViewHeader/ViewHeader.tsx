import { type AwarenessStates } from '@/contexts/CollaborationProvider'
import { ViewFocus } from './ViewFocus'
import { useAwareness, useNavigation, useView } from '@/hooks'
import { type LucideIcon } from '@ttab/elephant-ui/icons'
import { Avatar } from '../Avatar'
import { AvatarGroup } from '../AvatarGroup'

import { type PropsWithChildren } from 'react'

interface ViewHeaderProps {
  documentId?: string
  title: string
  shortTitle?: string
  icon?: LucideIcon
}

export const ViewHeader = ({ children, documentId, title, shortTitle, icon: Icon }: ViewHeaderProps & PropsWithChildren): JSX.Element => {
  const { state } = useNavigation()
  const { viewId } = useView()

  return (
    <header className='sticky top-0 flex items-center justify-items-stretch group-last:w-[calc(100%-5.5rem)] h-14 gap-3 px-3 border-b bg-background z-50'>
      <div className="flex flex-1 gap-2 items-center">
        {Icon !== undefined &&
          <Icon size={18} strokeWidth={1.75} />
        }

        <h2 className="font-bold">
          {typeof shortTitle !== 'string'
            ? <>{title}</>
            : <>
              <span className="@3xl/view:hidden">{shortTitle}</span>
              <span className="hidden @3xl/view:inline">{title}</span>
            </>
          }
        </h2>

        {children}
      </div>

      {!!documentId && <RemoteUsers documentId={documentId} />}

      <div>
        {state.content.length > 1 &&
          <ViewFocus viewId={viewId} />
        }
      </div>
    </header >
  )
}

function RemoteUsers({ documentId }: PropsWithChildren & { documentId: string }): JSX.Element {
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
