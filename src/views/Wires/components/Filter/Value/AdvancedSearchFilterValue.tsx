import { useMemo } from 'react'
import { SlidersHorizontalIcon } from '@ttab/elephant-ui/icons'
import { useTranslation } from 'react-i18next'
import { FilterBadge } from '../FilterBadge'
import { summarizeState, parseAdvancedSearchJson, wiresFields } from '@/components/AdvancedSearch'

// Filter values store the full AdvancedSearchState as a JSON string (serialized in FilterMenu)
export const AdvancedSearchFilterValue = ({ values }: {
  values: string[]
}) => {
  const { t } = useTranslation()

  const labels = useMemo(() => {
    if (!values[0]) {
      return [t('advancedSearch.title')]
    }
    const state = parseAdvancedSearchJson(values[0], 'AdvancedSearchFilterValue')
    if (state) {
      return summarizeState(state, wiresFields, t).map((b) => b.label)
    }
    return [t('advancedSearch.title')]
  }, [values, t])

  return (
    <>
      <SlidersHorizontalIcon size={18} strokeWidth={1.75} className='mr-2' />
      <FilterBadge labels={labels} />
    </>
  )
}
