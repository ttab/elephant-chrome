import { useMemo } from 'react'
import { Tooltip } from '@ttab/elephant-ui'
import { SlidersHorizontalIcon } from '@ttab/elephant-ui/icons'
import { useTranslation } from 'react-i18next'
import { FilterBadge } from '../FilterBadge'
import { summarizeState, parseAdvancedSearchJson, wiresFields } from '@/components/AdvancedSearch'
import { summarizeStateDetails } from '@/components/AdvancedSearch/lib/summarize'

// Filter values store the full AdvancedSearchState as a JSON string (serialized in FilterMenu)
export const AdvancedSearchFilterValue = ({ values }: {
  values: string[]
}) => {
  const { t } = useTranslation()

  const { labels, tooltipContent } = useMemo(() => {
    if (!values[0]) {
      return { labels: [t('advancedSearch.title')], tooltipContent: '' }
    }
    const state = parseAdvancedSearchJson(values[0], 'AdvancedSearchFilterValue', wiresFields)
    if (state) {
      const displayLabels = summarizeState(state, wiresFields, t).map((b) => b.label)
      const detailLabels = summarizeStateDetails(state, wiresFields, t).map((b) => b.label)
      return {
        labels: displayLabels,
        tooltipContent: detailLabels.join('\n')
      }
    }
    return { labels: [t('advancedSearch.title')], tooltipContent: '' }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- only recompute when the serialized state string changes
  }, [values[0], t])

  const content = (
    <>
      <SlidersHorizontalIcon size={18} strokeWidth={1.75} className='mr-2' />
      <FilterBadge labels={labels} />
    </>
  )

  if (tooltipContent) {
    return (
      <Tooltip content={tooltipContent}>
        <span className='flex items-center'>
          {content}
        </span>
      </Tooltip>
    )
  }

  return content
}
