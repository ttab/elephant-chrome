import type { JSX } from 'react'
import { Button, Tooltip } from '@ttab/elephant-ui'
import { SlidersHorizontalIcon, XIcon } from '@ttab/elephant-ui/icons'
import { useTranslation } from 'react-i18next'
import { summarizeState, summarizeStateDetails } from './lib/summarize'
import type { AdvancedSearchState, SearchFieldConfig } from './types'

interface AdvancedSearchBadgesProps {
  state: AdvancedSearchState
  fields: SearchFieldConfig[]
  onEdit?: () => void
  onClear: () => void
}

export const AdvancedSearchBadges = ({ state, fields, onEdit, onClear }: AdvancedSearchBadgesProps): JSX.Element => {
  const { t } = useTranslation()
  const badges = summarizeState(state, fields, t)
  const detailBadges = summarizeStateDetails(state, fields, t)
  const displayText = badges[0]?.label || t('advancedSearch.title')
  const tooltipContent = detailBadges.length > 0
    ? detailBadges.map((b) => b.label).join('\n')
    : t('advancedSearch.title')

  return (
    <div className='flex items-center gap-1 min-w-0 overflow-hidden'>
      <Tooltip content={tooltipContent}>
        <Button
          variant='ghost'
          size='sm'
          onClick={onEdit}
          className='flex items-center gap-1.5 min-w-0 overflow-hidden text-sm text-muted-foreground hover:text-foreground px-1 h-auto'
        >
          <SlidersHorizontalIcon size={14} strokeWidth={1.75} className='shrink-0' />
          <span className='truncate'>
            {displayText}
          </span>
        </Button>
      </Tooltip>
      <Button
        variant='ghost'
        size='xs'
        onClick={onClear}
        className='h-6 w-6 p-0 shrink-0'
      >
        <XIcon size={14} />
      </Button>
    </div>
  )
}
