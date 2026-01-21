import type { LucideIcon } from '@ttab/elephant-ui/icons'
import { cn } from '@ttab/elephant-ui/utils'

export const StatusMenuContext = ({ icon: Icon, className, title, description }: {
  icon?: LucideIcon
  className: string
  title: string
  description: string
}) => {
  return (
    <div className='flex flex-row gap-5 p-4 py-4 border-t text-secondary-foreground border-b bg-accent dark:bg-popover'>
      <div className='w-4 grow-0 shrink-0 pt-0.5'>
        {!!Icon && (
          <Icon
            size={24}
            strokeWidth={1.75}
            className={cn(className, '-mt-1')}
          />
        )}
      </div>
      <div className='grow flex flex-col gap-0.5 text-sm text-gray-600'>
        <div className='font-semibold'>{title}</div>
        <div className='text-sm'>{description}</div>
      </div>
    </div>
  )
}
