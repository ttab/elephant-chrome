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
  return (
    <>
      <div className='relative flex items-center justify-center pe-2 h-full'>
        <HistoryIcon
          status={status || 'draft'}
          isCurrent={isCurrent}
          isLast={isLast}
        />
      </div>

      <div className={cn(
        'py-1 ps-3 cursor-default',
        !title && 'text-muted-foreground',
        selected ? 'font-bold' : 'opacity-70'
      )}
      >
        {time}
      </div>


      <a
        className={cn(
          'py-1 ps-5 items-center truncate cursor-default',
          version && !selected && 'hover:cursor-pointer hover:underline',
          selected && 'font-bold'
        )}
        onClick={() => {
          if (version) {
            onSelect(version)
          }
        }}
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
