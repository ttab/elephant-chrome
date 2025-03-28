import { cn } from '@ttab/elephant-ui/utils'
import { type PropsWithChildren } from 'react'

export const Column = ({ className, children }: {
  className?: string
} & PropsWithChildren) => {
  return (
    <div className={cn(`
      w-[96vw]
      col-span-1
      flex-grow
      flex-shrink-0
      @lg/view:w-[49vw]
      @xl/view:w-[49vw]
      @2xl/view:w-[20vw]
      @fhd/view:w-[20vw]
      qhd:w-[auto]
      uhd:w-[auto]
      snap-center
      @lg/view:snap-start
      last:-border-s-0
      -mx-1
      px-2
      @lg/view:last:pe-1
      @lg/view:last:me-0
      flex
      flex-col
      bg-muted
      rounded-sm
      gap-1
      `, className)}
    >
      {children}
    </div>
  )
}
