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
        draft: 'border-s-[6px]',
        done: 'bg-[rgb(255,250,229)] border-[rgb(255,235,153)] border-s-[rgb(255,204,0)] border-s-[6px]',
        approved: 'bg-[rgb(214,246,218)] border-[rgb(151,233,161)] border-s-[rgb(40,191,58)] border-s-[6px]',
        withheld: 'bg-[rgb(189,244,248)] border-[rgb(120,232,241]) border-s-[rgb(0,194,244)] border-s-[6px]',
        usable: 'bg-[rgb(227,239,253)] border-[rgb(157,197,246)] border-s-[rgb(20,115,230)] border-s-[6px]'
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
        if (onSelect && event.target === ref.current) {
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
