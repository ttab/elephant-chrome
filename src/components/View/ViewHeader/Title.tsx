import { type LucideIcon } from '@ttab/elephant-ui/icons'
import { cva } from 'class-variance-authority'
import type { PropsWithChildren } from 'react'

export const Title = ({ title, short: shortTitle, icon: Icon, iconColor, asDialog }: {
  title: string
  short?: string
  icon: LucideIcon
  iconColor?: string
  asDialog?: boolean
} & PropsWithChildren): JSX.Element => {
  const viewVariants = cva('flex flex-1 gap-2 items-center grow-0 h-14 cursor-pointer', {
    variants: {
      asDialog: {
        false: 'px-4'
      }
    }
  })

  return (
    <div
      className={viewVariants({ asDialog })}
    >
      {!!Icon
      && <Icon size={18} strokeWidth={1.75} color={iconColor || '#222'} />}

      {!!title
      && (
        <h2 className='font-bold cursor-pointer whitespace-nowrap'>
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
