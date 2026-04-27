import { useCallback, memo, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import type { Wire } from '@/shared/schemas/wire'
import { cn } from '@ttab/elephant-ui/utils'
import { cva } from 'class-variance-authority'
import { Button } from '@ttab/elephant-ui'
import { RefreshCwIcon, SquareCheckIcon, SquareIcon, ZapIcon } from '@ttab/elephant-ui/icons'
import { getDocumentState, type StatusKey } from '@/lib/getDocumentState'
import type { WireStatus } from '../lib/setWireStatus'
import { StreamEntryCell } from './StreamEntryCell'
import { getWireStatus } from '@/lib/getWireStatus'

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
      isFlash: {
        true: '!border-s-red-500 text-red-500'
      },
      status: {
        read: 'border-s-approved bg-approved-background hover:bg-approved/20',
        saved: 'border-s-done bg-done-background hover:bg-done/30',
        used: 'border-s-usable bg-usable-background hover:bg-usable/30'
      },
      isUpdated: {
        true: 'bg-background'
      },
      wasSaved: {
        true: 'border-s-done'
      },
      wasUsed: {
        true: 'border-s-usable'
      },
      wasRead: {
        true: 'border-s-approved'
      }
    }
  }
)

export const StreamEntry = memo(({
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
  onToggleSelected: (wire: Wire, shiftKey: boolean) => void
  onFocus?: (item: Wire, event: React.FocusEvent<HTMLElement>) => void
  onPress?: (item: Wire, event: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) => void
}): JSX.Element => {
  const wireState = getDocumentState(entry)
  const { t } = useTranslation('wires')
  const lastStatus = getWireStatus(entry)
  // Use the pending mutation's status for optimistic display; fall back to actual wire state.
  // Rollback is automatic: clearing statusMutations (on both success and failure) reverts to
  // wireState.status, which reflects real data since no local data was mutated.
  const status: StatusKey = statusMutation ? statusMutation.name : wireState.status

  const handleClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
    onPress?.(entry, e)
  }, [entry, onPress])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onPress?.(entry, e)
    } else if (e.key === 'm' || e.key === 'M') {
      e.preventDefault()
      onToggleSelected(entry, e.shiftKey)
    }
  }, [entry, onPress, onToggleSelected])

  const handleFocus = useCallback((e: React.FocusEvent<HTMLElement>) => {
    onFocus?.(entry, e)
  }, [entry, onFocus])

  const handleToggleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    onToggleSelected(entry, e.shiftKey)
  }, [entry, onToggleSelected])

  const modified = new Date(entry.fields.modified.values[0])
  const compositeId = `${streamId}:${entry.id}`
  const { isFlash, wasFlash } = wireState

  return (
    <div className='group relative'>
      <div
        data-item-id={compositeId}
        data-entry-id={entry.id}
        tabIndex={0}
        className={cn(variants({ status: !status || ['flash', 'draft'].some((s) => status.includes(s)) ? null : (status as 'read' | 'used' | 'saved'), isFlash, wasSaved: lastStatus === 'saved', wasRead: lastStatus === 'read', wasUsed: lastStatus === 'used' }))}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onClick={handleClick}
      >

        <StreamEntryCell>
          {`${modified.getHours()}.${modified.getMinutes().toString().padStart(2, '0')}`}
        </StreamEntryCell>

        <StreamEntryCell className='flex items-center justify-center'>
          <span>
            {wasFlash && <ZapIcon size={12} strokeWidth={1.95} className='text-red-500/80 fill-red-500/5' />}
            {isFlash && <ZapIcon size={12} strokeWidth={1.95} className='text-red-500 fill-red-500' />}
          </span>
        </StreamEntryCell>

        <StreamEntryCell className={cn(
          'transition-[padding] duration-100',
          status === 'used' ? 'opacity-70' : '',
          isSelected || statusMutation ? 'last:pe-8' : 'group-has-[.checkbox-button:hover]:last:pe-8'
        )}
        >
          {entry.fields['document.title'].values[0] ?? t('stream.noTitle')}
        </StreamEntryCell>
      </div>

      {statusMutation && (
        <div className='checkbox-button absolute right-0 top-1.5 h-7 w-7 p-1 rounded opacity-40'>
          <RefreshCwIcon size={16} strokeWidth={2.25} className='animate-spin' />
        </div>
      )}

      {!statusMutation && (
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
})

StreamEntry.displayName = 'StreamEntry'
