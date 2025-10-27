import { ZapIcon, ZapOffIcon, type LucideIcon } from '@ttab/elephant-ui/icons'
import { cva } from 'class-variance-authority'
import { useEffect, useState, type PropsWithChildren } from 'react'
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
  ydoc,
  asStatic = false
}: {
  name: string
  title: string
  short?: string
  icon?: LucideIcon
  iconColor?: string
  asDialog?: boolean
  ydoc?: YDocument<Y.Map<unknown>>
  asStatic?: boolean
} & PropsWithChildren): JSX.Element => {
  const { connected, synced, provider } = ydoc ?? { connected: false, synced: false }
  const [isSyncing, setIsSyncing] = useState(-1)

  useEffect(() => {
    if (!provider) return

    if (synced) {
      setIsSyncing((val) => val === -1 ? 0 : 1)
    }

    setTimeout(() => {
      setIsSyncing(0)
    }, 3000)
  }, [synced, provider])

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

      {((connected && synced && isSyncing !== 1) || asStatic)
        && (
          <>
            {!Icon && !!ViewIcon && <ViewIcon size={18} strokeWidth={2.05} color={color || '#222'} />}
            {!!Icon && <Icon size={18} strokeWidth={2.05} color={iconColor || color || '#555'} />}
          </>
        )}

      {connected && provider && synced && isSyncing === 1
        && <ZapIcon className='animate-pulse fill-green-600 stroke-green-600' size={18} strokeWidth={2.05} />}

      {!connected && isSyncing > -1
        && (
          <>
            {synced
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
