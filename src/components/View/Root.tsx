import { Dispatch, PropsWithChildren, SetStateAction } from 'react'
import { Tabs } from '@ttab/elephant-ui'
import { cn } from '@ttab/elephant-ui/utils'
import { cva } from 'class-variance-authority'

export const Root = ({ children, className, tab, onTabChange, asDialog = false }: {
  className?: string
  asDialog?: boolean
  tab?: string
  onTabChange?: Dispatch<SetStateAction<string>>
} & PropsWithChildren): JSX.Element => {
  const variants = cva('flex flex-col', {
    variants: {
      asDialog: {
        true: '',
        false: 'h-screen'
      }
    }
  })

  return tab && onTabChange
    ? (
        <Tabs defaultValue={tab} onValueChange={onTabChange} className={cn(variants({ asDialog }), className)}>
          {children}
        </Tabs>
      )
    : (
        <div className={cn(variants({ asDialog }), className)}>
          {children}
        </div>
      )
}
