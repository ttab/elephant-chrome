import { cn } from '@ttab/elephant-ui/utils'
import { cva } from 'class-variance-authority'
import { PropsWithChildren } from 'react'

export const Root = ({ children, className, asDialog }: {
  className?: string
  asDialog?: boolean
} & PropsWithChildren): JSX.Element => {
  const viewVariants = cva('sticky top-0 flex items-center justify-items-start group-first/view-container:ml-[3rem] h-14 gap-4 pl-4 pr-3 border-b z-50', {
    variants: {
      asDialog: {
        false: 'bg-background',
        true: 'bg-gray-50'
      }
    }
  })

  return (
    <header className={cn(viewVariants({ asDialog }), className)}>
      {children}
    </header>
  )
}
