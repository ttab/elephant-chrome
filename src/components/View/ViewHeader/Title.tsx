import { type LucideIcon } from '@ttab/elephant-ui/icons'
import { cva } from 'class-variance-authority'
import type { PropsWithChildren } from 'react'
import { applicationMenu } from '@/defaults/applicationMenuItems'

export const Title = ({ name, title, short: shortTitle, iconColor, icon: Icon, asDialog }: {
  name: string
  title: string
  short?: string
  icon?: LucideIcon
  iconColor?: string
  asDialog?: boolean
} & PropsWithChildren): JSX.Element => {
  const viewVariants = cva('flex flex-1 gap-2 items-center grow-0 h-14 cursor-default', {
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
      {!Icon && !!ViewIcon && <ViewIcon size={18} strokeWidth={2.05} color={color || '#222'} />}
      {!!Icon && <Icon size={18} strokeWidth={2.05} color={iconColor || color || '#555'} />}

      {!!title && (
        <h2 className='font-bold cursor-default whitespace-nowrap opacity-90'>
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
