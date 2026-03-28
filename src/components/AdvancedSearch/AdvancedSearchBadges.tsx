import type { JSX } from 'react'
import { Button, Tooltip } from '@ttab/elephant-ui'
import { SlidersHorizontalIcon, XIcon } from '@ttab/elephant-ui/icons'
import { useTranslation } from 'react-i18next'
import { summarizeState } from './lib/summarize'
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
  const query = state.mode === 'querySyntax'
    ? state.querySyntax.raw.trim()
    : state.structured.query.trim()

  const tooltipLines = badges.length > 0
    ? badges.map((b) => b.label)
    : [t('advancedSearch.title')]

  return (
    <div className='flex items-center gap-1 min-w-0 overflow-hidden'>
      <Tooltip content={(
        <div className='flex flex-col gap-0.5 text-xs'>
          {tooltipLines.map((line, i) => (
            <span key={i}>{line}</span>
          ))}
        </div>
      )}
      >
        <button
          type='button'
          onClick={onEdit}
          className='flex items-center gap-1.5 min-w-0 overflow-hidden text-sm text-muted-foreground hover:text-foreground transition-colors'
        >
          <SlidersHorizontalIcon size={14} strokeWidth={1.75} className='shrink-0' />
          <span className='truncate'>
            {query || t('advancedSearch.title')}
          </span>
        </button>
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
