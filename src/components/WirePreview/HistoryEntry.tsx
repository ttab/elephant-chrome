import { Tooltip } from '@ttab/elephant-ui'
import { cn } from '@ttab/elephant-ui/utils'
import { HistoryIcon } from './HistoryIcon'

export const HistoryEntry = ({ version, isCurrent = false, status, isLast, title, time, onSelect, selected = false }: {
  version?: bigint
  isCurrent?: boolean
  status: string | null
  isLast?: boolean
  title?: string | null
  time?: string
  onSelect: (version: bigint) => void
  selected?: boolean
}) => {
  const isSelectable = !!version && !selected

  const handleSelect = (e: React.MouseEvent) => {
    e.preventDefault()
    if (isSelectable) {
      onSelect(version)
    }
  }

  return (
    <>
      <div
        className={cn(
          'relative flex items-center justify-center pe-2 h-full',
          isSelectable && 'cursor-pointer group-hover:bg-muted/60'
        )}
        onMouseDownCapture={handleSelect}
      >
        <HistoryIcon
          status={status || 'draft'}
          isCurrent={isCurrent}
          isLast={isLast}
        />
      </div>

      <div
        className={cn(
          'py-1 ps-2',
          isSelectable ? 'cursor-pointer group-hover:bg-muted/60' : 'cursor-default',
          !title && 'text-muted-foreground',
          selected && 'font-semibold'
        )}
        onMouseDownCapture={handleSelect}
      >
        {time}
      </div>

      <a
        className={cn(
          'py-0.5 ps-3 items-center truncate',
          isSelectable ? 'cursor-pointer group-hover:bg-muted/60' : 'cursor-default',
          selected && 'font-semibold'
        )}
        onMouseDownCapture={handleSelect}
      >
        {(title && version)
          ? (
              <Tooltip content={(
                <div className='flex flex-col gap-2'>
                  <span className='font-semibold'>
                    Version
                    {` `}
                    {version}
                  </span>

                  <span>
                    {title}
                  </span>
                </div>
              )}
              >
                {title}
              </Tooltip>
            )
          : (
              <span className={cn(
                'text-muted-foreground',
                selected && ' opacity-70'
              )}
              >
                <HistoryEntryTitle status={status} />
              </span>
            )}
      </a>
    </>
  )
}


const HistoryEntryTitle = ({ status }: { status: string | null }): string => {
  const statuses: Record<string, string> = {
    draft: '',
    done: 'Klarmarkerad',
    saved: 'Sparad',
    approved: 'Godkänd',
    read: 'Läst',
    usable: 'Publicerad',
    used: 'Använd',
    withheld: 'Tidspublicerad',
    cancelled: 'Avbruten',
    unpublished: 'Avpublicerad',
    flash: 'Flash',
    system: 'System'
  }
  return statuses[status ?? ''] || ''
}
