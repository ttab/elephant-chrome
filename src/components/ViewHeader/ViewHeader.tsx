import { type AwarenessStates } from '@/contexts/CollaborationProvider'
import { ViewFocus } from './ViewFocus'
import { useAwareness, useNavigation, useView } from '@/hooks'
import { type LucideIcon } from '@ttab/elephant-ui/icons'
import { Avatar } from '../Avatar'
import { AvatarGroup } from '../AvatarGroup'

import { useEffect, type PropsWithChildren } from 'react'
import { handleReset } from '../Link/lib/handleReset'

interface ViewHeaderProps {
  documentId?: string
  title: string
  shortTitle?: string
  icon?: LucideIcon
}

export const ViewHeader = ({ children, documentId, title, shortTitle, icon: Icon }: ViewHeaderProps & PropsWithChildren): JSX.Element => {
  const { state, dispatch } = useNavigation()
  const { viewId, isActive } = useView()

  useEffect(() => {
    // Only add event listener if the view is active
    if (isActive) {
      const keyDownHandler = (evt: KeyboardEvent): void => {
        if (evt.altKey && evt.shiftKey && /^Digit\d$/.test(evt.code)) {
          try {
            const viewIndex = parseInt(evt.code.slice(-1)) - 1
            const viewId = state.content[viewIndex].key


            if (viewId) {
              handleReset({ viewId, dispatch })
            }
          } catch {
            console.warn('Invalid view index')
          }
        }
      }
      document.addEventListener('keydown', keyDownHandler)

      return () => document.removeEventListener('keydown', keyDownHandler)
    }
  }, [state, dispatch, isActive])

  return (
    <header className='sticky top-0 flex items-center justify-items-stretch group-last:w-[calc(100%-5.5rem)] h-14 gap-3 px-3 border-b bg-background z-50'>
      <div className="flex flex-1 gap-2 items-center">
        {Icon !== undefined &&
          <Icon size={18} strokeWidth={1.75} onClick={() => handleReset({ viewId, dispatch })} />
        }

        <h2 className="font-bold cursor-pointer" onClick={() => handleReset({ viewId, dispatch })}>
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
