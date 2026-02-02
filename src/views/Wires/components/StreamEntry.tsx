import { useCallback, type JSX, type ReactNode } from 'react'
import type { Wire } from '@/shared/schemas/wire'
import { cn } from '@ttab/elephant-ui/utils'
import { cva } from 'class-variance-authority'
import { Button } from '@ttab/elephant-ui'
import { RefreshCwIcon, SquareCheckIcon, SquareIcon } from '@ttab/elephant-ui/icons'
import { getWireStatus } from '@/lib/getWireStatus'
import type { WireStatus } from '../lib/setWireStatus'

export const StreamEntry = ({
  streamId,
  entry,
  isSelected,
  statusMutation,
  onToggleSelected,
  onFocus,
  onUnpress,
  onPress
}: {
  streamId: string
  entry: Wire
  isSelected: boolean
  statusMutation: WireStatus | undefined
  onToggleSelected: (event: unknown) => void
  onFocus?: (item: Wire, event: React.FocusEvent<HTMLElement>) => void
  onUnpress?: (item: Wire, event: React.KeyboardEvent<HTMLElement>) => void
  onPress?: (item: Wire, event: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) => void
}): JSX.Element => {
  const status = getWireStatus(entry)

  const handleClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
    onPress?.(entry, e)
  }, [entry, onPress])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onPress?.(entry, e)
    } else if (e.key === ' ') {
      e.preventDefault()
      if (status !== 'used') {
        onToggleSelected(e)
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onUnpress?.(entry, e)
    }
  }, [entry, onPress, onToggleSelected, onUnpress, status])

  const handleFocus = useCallback((e: React.FocusEvent<HTMLElement>) => {
    onFocus?.(entry, e)
  }, [entry, onFocus])

  const handleToggleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    onToggleSelected(e)
  }, [onToggleSelected])

  const variants = cva(
    `
      relative
      grid
      grid-cols-[3rem_1fr]
      gap-3 border-s-[7px]
      bg-background
      text-[0.785rem]
      subpixel-antialiased
      cursor-default
      ring-inset
      focus:outline-none
      focus:ring-2
      focus:ring-table-selected
      hover:bg-muted
    `,
    {
      variants: {
        status: {
          draft: '',
          read: 'border-s-approved bg-approved-background',
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
        <StreamEntryCell className={cn(
          'transition-[padding] duration-100',
          isSelected || statusMutation ? 'last:pe-8' : 'group-has-[.checkbox-button:hover]:last:pe-8'
        )}
        >
          {entry.fields['document.title'].values[0] ?? 'No title'}
        </StreamEntryCell>
      </div>

      {statusMutation && (
        <div className='checkbox-button absolute right-0 top-1.5 h-7 w-7 p-1 rounded opacity-40'>
          <RefreshCwIcon size={16} strokeWidth={2.25} className='animate-spin' />
        </div>
      )}

      {!statusMutation && status !== 'used' && (
        <Button
          variant='icon'
          size='lg'
          tabIndex={-1}
          className={cn(
            'checkbox-button absolute right-0 top-0 h-9 w-9 p-0 transition-opacity duration-150 bg-transparent!',
            isSelected ? 'opacity-60 hover:opacity-100' : 'opacity-0 hover:opacity-60'
          )}
          onMouseDown={(e) => {
            e.preventDefault()
          }}
          onClick={handleToggleClick}
        >
          {isSelected
            ? <SquareCheckIcon size={22} strokeWidth={1.85} />
            : <SquareIcon size={22} strokeWidth={1.85} />}
        </Button>
      )}
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
