import { cn } from '@ttab/elephant-ui/utils'
import { type PropsWithChildren } from 'react'

export const Column = ({ className, children }: {
  className?: string
} & PropsWithChildren) => {
  return (
    <div className={cn(`
      col-span-1
      flex-grow
      flex-shrink-0
      snap-center
      flex
      flex-col
      bg-muted
      rounded-sm
      gap-1
      -mx-1
      @md/view:px-2
      px-1
      last:-border-s-0
      @lg/view:w-[49vw]
      @xl/view:w-[49vw]
      @2xl/view:w-[25vw]
      @fhd/view:w-[25vw]
      qhd:w-[auto]
      uhd:w-[auto]
      @lg/view:snap-start
      @lg/view:last:pe-1
      @lg/view:last:me-0
      `, className)}
    >
      {children}
    </div>
  )
}
