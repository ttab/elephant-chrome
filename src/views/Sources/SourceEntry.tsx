import { useCallback, type JSX } from 'react'
import type { Block } from '@ttab/elephant-api/newsdoc'
import { CableIcon } from '@ttab/elephant-ui/icons'
import { cn } from '@ttab/elephant-ui/utils'

export const SourceEntry = ({
  block,
  isSelected,
  onSelect
}: {
  block: Block
  isSelected: boolean
  onSelect: (id: string) => void
}): JSX.Element => {
  const handleClick = useCallback(() => {
    onSelect(block.uuid)
  }, [block.uuid, onSelect])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(block.uuid)
    }
  }, [block.uuid, onSelect])

  return (
    <div
      role='button'
      tabIndex={0}
      className={cn(
        'flex items-center gap-2 px-4 py-2.5 cursor-pointer select-none',
        'text-sm hover:bg-muted border-b last:border-b-0',
        'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-table-selected',
        isSelected ? 'bg-muted font-medium' : 'text-muted-foreground'
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <CableIcon size={15} strokeWidth={1.75} className='shrink-0' />
      <span className='flex-1 truncate'>{block.title || block.uuid}</span>
    </div>
  )
}
