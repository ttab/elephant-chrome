import { useNavigationKeys } from '@/hooks/useNavigationKeys'
import { cn } from '@ttab/elephant-ui/utils'
import type { MouseEvent } from 'react'
import { useEffect, useRef, type PropsWithChildren } from 'react'

export const Root = ({ className, isFocused, onSelect, children }: {
  isFocused?: boolean
  onSelect?: (event: KeyboardEvent | MouseEvent<HTMLDivElement>) => void
  className?: string
} & PropsWithChildren) => {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (ref?.current && isFocused) {
      ref.current.focus()
    }
  })

  useNavigationKeys({
    elementRef: ref,
    keys: ['Enter', ' '],
    onNavigation: (event) => {
      if (onSelect) {
        onSelect(event)
      }
    }
  })

  return (
    <div
      ref={ref}
      tabIndex={0}
      className={cn(`
        flex
        flex-col
        justify-stretch
        gap-2
        border
        bg-white
        rounded
        p-2
        text-xs
        outline-none
        ring-inset
        focus-visible:ring-table-selected
        focus-visible:ring-2
        `, className)}
      onClick={(event) => {
        if (onSelect) {
          onSelect(event)
        }
      }}
    >
      {children}
    </div>
  )
}
