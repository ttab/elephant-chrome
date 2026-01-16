import { type JSX, type ReactNode } from 'react'
import type { Wire } from '@/shared/schemas/wire'
import { cn } from '@ttab/elephant-ui/utils'
import { cva } from 'class-variance-authority'

export const StreamEntry = ({ streamId, entry, status = 'saved' }: {
  streamId: string
  entry: Wire
  status?: 'saved' | 'used'
}): JSX.Element => {
  const variants = cva(
    `
      grid
      grid-cols
      grid-cols-[3rem_1fr]
      gap-3 border-s-[6px]
      bg-background
      text-[0.785rem]
      subpixel-antialiased
      cursor-default
      ring-inset
      focus:outline-none
      focus-visible:ring-2
      focus-visible:ring-table-selected
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
    <div
      data-item-id={compositeId}
      data-entry-id={entry.id}
      tabIndex={0}
      className={cn(variants({ status, newsvalue }))}
    >
      <StreamEntryCell>
        {`${modified.getHours()}.${modified.getMinutes().toString().padStart(2, '0')}`}
      </StreamEntryCell>
      <StreamEntryCell>
        {entry.fields['document.title'].values[0] ?? 'No title'}
      </StreamEntryCell>
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
        'first:ps-5 first:font-thin first:opacity-65',
        'last:pe-6 last:truncate last:tracking-[0.015em]',
        className
      )}
    >
      {children}
    </div>
  )
}
