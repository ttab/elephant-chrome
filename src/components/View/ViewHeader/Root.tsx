import { useHistory } from '@/hooks/index'
import { useView } from '@/hooks/useView'
import { cn } from '@ttab/elephant-ui/utils'
import { cva } from 'class-variance-authority'
import type { PropsWithChildren } from 'react'

export const Root = ({ children, className, asDialog }: {
  className?: string
  asDialog?: boolean
} & PropsWithChildren): JSX.Element => {
  const { isActive, isFocused } = useView()
  const { state } = useHistory()

  const viewVariants = cva('sticky flex items-center justify-items-start px-4 group-first/view-container:ps-16 h-14 gap-3 border-b overflow-hidden', {
    variants: {
      isActiveView: {
        true: 'rounded-t-2xl bg-gray-75 dark:bg-secondary'
      },
      isSingleView: {
        true: 'bg-background'
      },
      asDialog: {
        true: 'bg-gray-50 sticky top-0 z-10'
      }
    }
  })

  const isSingleView = (state?.contentState.length === 1 && !asDialog)
  const isActiveView = (isActive && !asDialog) || isFocused

  return (
    <header className={cn(viewVariants({ asDialog, isActiveView, isSingleView }), className)}>
      {children}
    </header>
  )
}
