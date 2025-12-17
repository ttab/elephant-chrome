import { WifiOffIcon, type LucideIcon } from '@ttab/elephant-ui/icons'
import { cva } from 'class-variance-authority'
import { useEffect, useRef, useState, type PropsWithChildren, type JSX } from 'react'
import { applicationMenu } from '@/defaults/applicationMenuItems'
import type { YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'
import { useQuery } from '@/hooks/useQuery'

export const Title = ({
  name,
  title,
  short: shortTitle,
  iconColor,
  icon: Icon,
  asDialog,
  ydoc,
  preview
}: {
  name: string
  title: string
  short?: string
  icon?: LucideIcon
  iconColor?: string
  asDialog?: boolean
  ydoc?: YDocument<Y.Map<unknown>>
  preview?: boolean
} & PropsWithChildren): JSX.Element => {
  const { connected, synced } = ydoc ?? { connected: false, synced: false }
  const [isConnected, setIsConnected] = useState(true)
  const [isSynced, setIsSynced] = useState(true)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const timeout2Ref = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setIsConnected(connected)
    }, 1000)
  }, [connected, synced])

  useEffect(() => {
    if (timeout2Ref.current) {
      clearTimeout(timeout2Ref.current)
    }

    timeout2Ref.current = setTimeout(() => {
      setIsSynced(synced)
    }, 1000)
  }, [synced])

  const viewVariants = cva('flex flex-1 gap-2 items-center grow-0 h-14 cursor-default dark:bg-secondary', {
    variants: {
      asDialog: {
        false: 'px-4'
      }
    }
  })

  const [, setQuery] = useQuery()

  const handleEdit = () => {
    if (!preview) {
      return
    }
    setQuery({ preview: undefined })
  }

  const { icon: ViewIcon, color } = applicationMenu.groups
    .flatMap((g) => g.items)
    .find((i) => i.name === name) || {}

  const displayTitle = preview && title
    ? `${title} - Förhandsvisning`
    : title
  const displayShortTitle = preview && shortTitle
    ? `${shortTitle} - Förhandsvisning`
    : shortTitle

  return (
    <div className={viewVariants({ asDialog })}>

      {(!ydoc || (isConnected && isSynced)) && (
        <>
          {!Icon && !!ViewIcon && <ViewIcon size={18} strokeWidth={2.05} color={color || '#222'} onClick={handleEdit} />}
          {!!Icon && <Icon size={18} strokeWidth={2.05} color={iconColor || color || '#555'} onClick={handleEdit} />}
        </>
      )}

      {ydoc && !isConnected && (
        <>
          {isSynced
            ? <WifiOffIcon className='animate-pulse' size={18} strokeWidth={2.05} color={iconColor || color || '#555'} />
            : <WifiOffIcon className='animate-pulse fill-red-600 stroke-red-600' size={18} strokeWidth={2.05} />}
        </>
      )}

      {!!displayTitle && (
        <h2 role='header-title' className='font-bold cursor-default whitespace-nowrap opacity-90 dark:bg-secondary'>
          {typeof shortTitle !== 'string'
            ? <>{displayTitle}</>
            : (
                <>
                  <span className='@3xl/view:hidden'>{displayShortTitle}</span>
                  <span className='hidden @3xl/view:inline' role='header-title'>{displayTitle}</span>
                </>
              )}
        </h2>
      )}
    </div>
  )
}
