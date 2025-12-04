import { Alert, AlertDescription } from '@ttab/elephant-ui'
import { InfoIcon, TriangleAlertIcon } from '@ttab/elephant-ui/icons'
import { cn } from '@ttab/elephant-ui/utils'
import { cva } from 'class-variance-authority'
import type { PropsWithChildren } from 'react'

const sectionVariants = cva('overscroll-auto @5xl:w-[1024px] space-y-4', {
  variants: {
    asCreateDialog: {
      false: 'px-8',
      true: ''
    }
  }
})

export const UserMessage = ({ asDialog, children, variant, className }: {
  asDialog: boolean
  variant?: 'default' | 'destructive'
  children: React.ReactNode
  className?: string
} & PropsWithChildren) => {
  const variants = cva('', {
    variants: {
      variant: {
        default: 'bg-gray-50',
        destructive: 'bg-red-50'
      }
    }
  })

  return asDialog && (
    <section className={cn(sectionVariants({ asCreateDialog: asDialog }), className)}>
      <Alert className={cn(variants({ variant }))} variant={variant ?? 'default'}>
        {variant === 'destructive'
          ? <TriangleAlertIcon size={18} strokeWidth={1.75} className='text-muted-foreground' />
          : <InfoIcon size={18} strokeWidth={1.75} className='text-muted-foreground' />}
        <AlertDescription>
          {children}
        </AlertDescription>
      </Alert>
    </section>
  )
}
