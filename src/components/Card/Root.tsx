import { useNavigationKeys } from '@/hooks/useNavigationKeys'
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
  useEffect(() => {
    if (ref?.current && isFocused) {
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
      },
      status: {
        done: 'bg-[rgb(255,250,229)] border-[rgb(255,235,153)]',
        approved: 'bg-[rgb(214,246,218)] border-[rgba(151,233,161,0.8)]',
        withheld: 'bg-[rgb(189,244,248)] border-[rgb(120,232,241])',
        usable: 'bg-[rgb(227,239,253)] border-[rgb(157,197,246)]'
      },
      defaultVariants: {
        status: undefined // No default style for status
      }
    }
  })

  return (
    <div
      title={status}
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
function isValidStatus(value?: string): value is 'done' | 'approved' | 'withheld' | 'usable' {
  return ['done', 'approved', 'withheld', 'usable'].includes(value ?? '')
}
