import { Alert, AlertDescription } from '@ttab/elephant-ui'
import { InfoIcon } from '@ttab/elephant-ui/icons'
import { cn } from '@ttab/elephant-ui/utils'
import { cva } from 'class-variance-authority'
import type { PropsWithChildren } from 'react'

const sectionVariants = cva('overscroll-auto @5xl:w-[1024px] space-y-4', {
  variants: {
    asCreateDialog: {
      false: 'px-8',
      true: 'px-6'
    }
  }
})

export const UserMessage = ({ asDialog, children }: { asDialog: boolean } & PropsWithChildren) => {
  return (
    <section className={cn(sectionVariants({ asCreateDialog: asDialog }))}>
      <Alert className='bg-gray-50' variant='default'>
        <InfoIcon size={18} strokeWidth={1.75} className='text-muted-foreground' />
        <AlertDescription>
          {children}
        </AlertDescription>
      </Alert>
    </section>
  )
}
