import { useNavigationKeys } from '@/hooks/useNavigationKeys'
import { useView } from '@/hooks/useView'
import { cn } from '@ttab/elephant-ui/utils'
import { cva } from 'class-variance-authority'
import type { MouseEvent } from 'react'
import { useEffect, useRef, type PropsWithChildren } from 'react'

/**
 * Root component for Card.
 *
 * Can take any status as prop but will only set colors on a fixed set of statuses that
 * have defined colors. Will use default color for all unknown statuses.
 */
export const Root = ({ className, isFocused = false, isSelected = false, status, onSelect, children }: {
  isFocused?: boolean
  isSelected?: boolean
  onSelect?: (event: KeyboardEvent | MouseEvent<HTMLDivElement>) => void
  className?: string
  status?: string
} & PropsWithChildren) => {
  const ref = useRef<HTMLDivElement>(null)
  const { isActive } = useView()

  useEffect(() => {
    if (ref?.current && isFocused && isActive) {
      ref.current.focus()

      ref.current.scrollIntoView({
        block: 'nearest'
      })
    }
  })

  useNavigationKeys({
    elementRef: ref,
    keys: ['Enter', ' '],
    onNavigation: (event) => {
      if (onSelect && event.target === ref.current) {
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
    focus-visible:ring-table-selected
    focus-visible:ring-2
    focus-visible:ring-offset-1
    cursor-default
    group
    `, {
    variants: {
      isSelected: {
        true: 'outline-solid outline-gray-400 outline-2 outline-offset-1 focus-visible:ring-offset-2 focus-visible:outline-offset-1 focus-visible:outline-1'
      },
      status: {
        draft: 'border-s-[6px] bg-background',
        done: 'bg-done-background border-done-border border-s-done border-s-[6px]',
        approved: 'bg-approved-background border-approved-border border-s-approved border-s-[6px]',
        withheld: 'bg-withheld-background border-withheld-border border-s-withheld border-s-[6px]',
        usable: 'bg-usable-background border-usable-background border-s-usable border-s-[6px]'
      },
      defaultVariants: {
        status: undefined // No default style for status
      }
    }
  })

  return (
    <div
      ref={ref}
      tabIndex={0}
      className={cn(variants({
        isSelected,
        status: isValidStatus(status) ? status : undefined
      }), className)}
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

/*
 * Type guard for valid statuses that the Root card can handle
 */
function isValidStatus(value?: string): value is 'draft' | 'done' | 'approved' | 'withheld' | 'usable' {
  return ['draft', 'done', 'approved', 'withheld', 'usable'].includes(value ?? '')
}
