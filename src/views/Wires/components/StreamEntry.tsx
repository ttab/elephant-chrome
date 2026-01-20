import { useCallback, useEffect, useState, type JSX, type ReactNode } from 'react'
import type { Wire } from '@/shared/schemas/wire'
import { cn } from '@ttab/elephant-ui/utils'
import { cva } from 'class-variance-authority'
import { Button } from '@ttab/elephant-ui'
import { SquareCheckIcon, SquareIcon } from '@ttab/elephant-ui/icons'

export const StreamEntry = ({ streamId, entry, status = 'saved', onFocus, onUnpress, onSelect, onPress }: {
  streamId: string
  entry: Wire
  status?: 'saved' | 'used'
  onFocus?: (item: Wire, event: React.FocusEvent<HTMLElement>) => void
  onUnpress?: (item: Wire, event: React.KeyboardEvent<HTMLElement>) => void
  onSelect?: (item: Wire, selected: boolean) => void
  onPress?: (item: Wire, event: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) => void
}): JSX.Element => {
  const [isSelected, setIsSelected] = useState(false)

  useEffect(() => {
    onSelect?.(entry, isSelected)
  }, [entry, isSelected, onSelect])

  const handleClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
    onPress?.(entry, e)
  }, [entry, onPress])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onPress?.(entry, e)
    } else if (e.key === ' ') {
      e.preventDefault()
      setIsSelected((curr) => !curr)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onUnpress?.(entry, e)
    }
  }, [entry, onPress, onUnpress])

  const handleFocus = useCallback((e: React.FocusEvent<HTMLElement>) => {
    onFocus?.(entry, e)
  }, [entry, onFocus])

  const variants = cva(
    `
      relative
      grid
      grid-cols-[3rem_1fr]
      gap-3 border-s-[6px]
      bg-background
      text-[0.785rem]
      subpixel-antialiased
      cursor-default
      ring-inset
      focus:outline-none
      focus:ring-2
      focus:ring-table-selected
      focus:z-20
      hover:bg-background
    `,
    {
      variants: {
        status: {
          saved: 'border-s-done bg-done-background',
          used: 'border-s-usable bg-usable-background'
        },
        newsvalue: {
          6: 'border-s-red-500'
        },
        isUpdated: {
          true: 'bg-background'
        }
      }
    }
  )

  const modified = new Date(entry.fields.modified.values[0])
  const newsvalue = entry.fields['document.meta.core_newsvalue.value']?.values[0] === '6' ? 6 : undefined
  const compositeId = `${streamId}:${entry.id}`

  return (
    <div className='relative group'>
      <div
        data-item-id={compositeId}
        data-entry-id={entry.id}
        tabIndex={0}
        className={cn(variants({ status, newsvalue }))}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onClick={handleClick}
      >
        <StreamEntryCell>
          {`${modified.getHours()}.${modified.getMinutes().toString().padStart(2, '0')}`}
        </StreamEntryCell>
        <StreamEntryCell className={isSelected ? 'last:pe-8' : 'group-hover:last:pe-8'}>
          {entry.fields['document.title'].values[0] ?? 'No title'}
        </StreamEntryCell>
      </div>

      <Button
        variant='icon'
        size='lg'
        tabIndex={-1} // Should not be navigable, use space to select/deselect
        className={cn(
          'absolute right-0 top-0 h-9 w-9 p-0 transition-opacity z-50 bg-transparent!',
          isSelected ? 'opacity-100' : 'opacity-0 hover:opacity-80'
        )}
        onMouseDown={(e) => {
          // Should not receive focus when clicked
          e.preventDefault()
        }}
        onClick={(e) => {
          e.stopPropagation()
          setIsSelected((curr) => !curr)
        }}
      >
        {isSelected
          ? <SquareCheckIcon size={24} strokeWidth={2.25} className='opacity-60' />
          : <SquareIcon size={24} strokeWidth={2.25} className='opacity-60' />}
      </Button>
    </div>
  )
}

const StreamEntryCell = ({ children, className }: {
  children: ReactNode
  className?: string
}): JSX.Element => {
  return (
    <div
      className={cn(
        'px-2 py-2',
        'first:ps-4 first:font-thin first:opacity-65',
        'last:pe-4 last:truncate last:min-w-0 last:tracking-[0.015em]',
        className
      )}
    >
      {children}
    </div>
  )
}
