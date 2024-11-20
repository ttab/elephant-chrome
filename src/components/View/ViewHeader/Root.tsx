import { useView } from '@/hooks/useView'
import { cn } from '@ttab/elephant-ui/utils'
import { cva } from 'class-variance-authority'
import { PropsWithChildren } from 'react'

export const Root = ({ children, className, asDialog }: {
  className?: string
  asDialog?: boolean
} & PropsWithChildren): JSX.Element => {
  const { isActive } = useView()

  const viewVariants = cva('sticky flex items-center justify-items-start px-4 group-first/view-container:ps-16 h-14 gap-4 border-b overflow-hidden', {
    variants: {
      isActive: {
        true: 'rounded-t-2xl bg-gray-75'
      },
      asDialog: {
        true: 'bg-gray-50'
      }
    }
  })

  return (
    <header className={cn(viewVariants({ asDialog, isActive }), className)}>
      {children}
    </header>
  )
}
