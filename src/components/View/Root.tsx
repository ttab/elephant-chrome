import type { Dispatch, PropsWithChildren, SetStateAction } from 'react'
import { useEffect, useRef } from 'react'
import { Tabs } from '@ttab/elephant-ui'
import { cn } from '@ttab/elephant-ui/utils'
import { cva } from 'class-variance-authority'

export const Root = ({ children, className, tab, onTabChange, asDialog = false }: {
  className?: string
  asDialog?: boolean
  tab?: string
  onTabChange?: Dispatch<SetStateAction<string>>
} & PropsWithChildren): JSX.Element => {
  const divRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!tab && !onTabChange && divRef.current) {
      divRef.current.focus()
      divRef.current.blur()
    }
  }, [tab, onTabChange])

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
        <div ref={divRef} className={cn(variants({ asDialog }), className)} tabIndex={0}>
          {children}
        </div>
      )
}
