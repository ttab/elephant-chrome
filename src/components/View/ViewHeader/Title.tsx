import { ZapIcon, ZapOffIcon, type LucideIcon } from '@ttab/elephant-ui/icons'
import { cva } from 'class-variance-authority'
import { useEffect, useRef, useState, type PropsWithChildren } from 'react'
import { applicationMenu } from '@/defaults/applicationMenuItems'
import type { YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'

export const Title = ({
  name,
  title,
  short: shortTitle,
  iconColor,
  icon: Icon,
  asDialog,
  ydoc
}: {
  name: string
  title: string
  short?: string
  icon?: LucideIcon
  iconColor?: string
  asDialog?: boolean
  ydoc?: YDocument<Y.Map<unknown>>
} & PropsWithChildren): JSX.Element => {
  const { connected, synced, provider } = ydoc ?? { connected: false, synced: false }
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

  const { icon: ViewIcon, color } = applicationMenu.groups
    .flatMap((g) => g.items)
    .find((i) => i.name === name) || {}

  return (
    <div className={viewVariants({ asDialog })}>

      {(!ydoc || (isConnected && isSynced)) && (
        <>
          {!Icon && !!ViewIcon && <ViewIcon size={18} strokeWidth={2.05} color={color || '#222'} />}
          {!!Icon && <Icon size={18} strokeWidth={2.05} color={iconColor || color || '#555'} />}
        </>
      )}

      {!isConnected && (
        <>
          {isSynced
            ? <ZapOffIcon className='animate-pulse' size={18} strokeWidth={2.05} color={iconColor || color || '#555'} />
            : <ZapOffIcon className='animate-pulse fill-red-600 stroke-red-600' size={18} strokeWidth={2.05} />}
        </>
      )}

      {!!title && (
        <h2 role='header-title' className='font-bold cursor-default whitespace-nowrap opacity-90 dark:bg-secondary'>
          {typeof shortTitle !== 'string'
            ? <>{title}</>
            : (
                <>
                  <span className='@3xl/view:hidden'>{shortTitle}</span>
                  <span className='hidden @3xl/view:inline' role='header-title'>{title}</span>
                </>
              )}
        </h2>
      )}
    </div>
  )
}
