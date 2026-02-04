import { CommandItem } from '@ttab/elephant-ui'
import { XIcon } from '@ttab/elephant-ui/icons'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'

export const ClearFilter = ({ hasFilter, onClear }: {
  hasFilter: boolean
  onClear: () => void
}): JSX.Element | null => {
  const { t } = useTranslation()
  return hasFilter
    ? (
        <CommandItem
          onSelect={onClear}
        >
          <XIcon size={18} strokeWidth={1.75} />
          {t('shared:toolbar.clearFilters')}
        </CommandItem>
      )
    : null
}
