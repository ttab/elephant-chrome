import type { Dispatch, PropsWithChildren, SetStateAction, JSX } from 'react'
import { useEffect, useRef, forwardRef } from 'react'
import { Tabs } from '@ttab/elephant-ui'
import { cn } from '@ttab/elephant-ui/utils'
import { cva } from 'class-variance-authority'

type ViewRootProps = {
  className?: string
  asDialog?: boolean
  tab?: string
  onTabChange?: Dispatch<SetStateAction<string>>
} & PropsWithChildren

export const Root = forwardRef<HTMLDivElement, ViewRootProps>(
  ({ children, className, tab, onTabChange, asDialog = false }, forwardedRef): JSX.Element => {
    const localRef = useRef<HTMLDivElement>(null)

    // Use forwarded ref if provided, otherwise fallback to local
    const ref = (forwardedRef as React.RefObject<HTMLDivElement>) ?? localRef

    useEffect(() => {
      if (!asDialog && !tab && !onTabChange && ref.current) {
        ref.current.focus()
        ref.current.blur()
      }
    }, [asDialog, tab, onTabChange, ref])

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
          <Tabs
            defaultValue={tab}
            onValueChange={onTabChange}
            className={cn(variants({ asDialog }), className)}
          >
            {children}
          </Tabs>
        )
      : (
          <div
            ref={ref}
            className={cn(variants({ asDialog }), className)}
            tabIndex={0}
          >
            {children}
          </div>
        )
  }
)

Root.displayName = 'View.Root'
