import { useNavigationKeys } from '@/hooks/useNavigationKeys'
import { cn } from '@ttab/elephant-ui/utils'
import { cva } from 'class-variance-authority'
import type { MouseEvent } from 'react'
import { useEffect, useRef, type PropsWithChildren } from 'react'

export const Root = ({ className, isFocused = false, isSelected = false, onSelect, children }: {
  isFocused?: boolean
  isSelected?: boolean
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

  const variants = cva(`
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
    cursor-default
    `, {
    variants: {
      isSelected: {
        true: 'bg-table-selected focus-visible:outline-table-selected'
      }
    }
  })

  return (
    <div
      ref={ref}
      tabIndex={0}
      className={cn(variants({ isSelected }), className)}
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
