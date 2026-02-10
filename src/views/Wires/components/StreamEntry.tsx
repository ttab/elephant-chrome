import { useCallback, type JSX } from 'react'
import type { Wire } from '@/shared/schemas/wire'
import { cn } from '@ttab/elephant-ui/utils'
import { cva } from 'class-variance-authority'
import { Button } from '@ttab/elephant-ui'
import { RefreshCwIcon, SquareCheckIcon, SquareIcon, ZapIcon } from '@ttab/elephant-ui/icons'
import { getWireStatus } from '@/lib/getWireStatus'
import type { WireStatus } from '../lib/setWireStatus'
import { StreamEntryCell } from './StreamEntryCell'
import { getWireStatuses } from '@/lib/getWireStatuses'

export const StreamEntry = ({
  streamId,
  entry,
  isSelected,
  statusMutation,
  onToggleSelected,
  onFocus,
  onPress
}: {
  streamId: string
  entry: Wire
  isSelected: boolean
  statusMutation: WireStatus | undefined
  onToggleSelected: (event: unknown) => void
  onFocus?: (item: Wire, event: React.FocusEvent<HTMLElement>) => void
  onPress?: (item: Wire, event: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) => void
}): JSX.Element => {
  const status = getWireStatus(entry)
  const statuses = getWireStatuses(entry)

  const handleClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
    onPress?.(entry, e)
  }, [entry, onPress])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onPress?.(entry, e)
    } else if (e.key === 'm') {
      if (status !== 'used') {
        e.preventDefault()
        onToggleSelected(e)
      }
    }
  }, [entry, onPress, onToggleSelected, status])

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
      grid-cols-[3rem_0.75rem_1fr]
      gap-0.5 border-s-[7px]
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
        flashLevel: {
          // Current version is a flash
          1: '!border-s-red-500 text-red-500',
          // Historic version was a flash
          2: ''
        },
        status: {
          draft: '',
          read: 'border-s-approved bg-approved-background hover:bg-approved/20',
          saved: 'border-s-done bg-done-background hover:bg-done/30',
          used: 'border-s-usable bg-usable-background hover:bg-usable/30'
        },
        isUpdated: {
          true: 'bg-background'
        }
      }
    }
  )

  const modified = new Date(entry.fields.modified.values[0])
  const newsvalue = entry.fields['document.meta.core_newsvalue.value']?.values[0] === '6' ? 6 : undefined
  let flashLevel: null | 1 | 2 = null
  if (newsvalue === 6) {
    flashLevel = 1
  } else if (statuses.find((s) => s.key === 'flash')) {
    flashLevel = 2
  }

  const compositeId = `${streamId}:${entry.id}`
  return (
    <div className='group relative'>
      <div
        data-item-id={compositeId}
        data-entry-id={entry.id}
        tabIndex={0}
        className={cn(variants({ status, flashLevel }))}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onClick={handleClick}
      >
        <StreamEntryCell>
          {`${modified.getHours()}.${modified.getMinutes().toString().padStart(2, '0')}`}
        </StreamEntryCell>

        <StreamEntryCell className='flex items-center justify-center'>
          <span>
            {!!flashLevel && <ZapIcon size={12} strokeWidth={1.95} className='text-red-500' fill='oklch(62.8% 0.257 29.23)' />}
          </span>
        </StreamEntryCell>

        <StreamEntryCell className={cn(
          'transition-[padding] duration-100',
          status === 'used' ? 'opacity-70' : '',
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
