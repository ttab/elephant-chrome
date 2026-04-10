import { CommandList } from '@ttab/elephant-ui'
import { ClearFilter } from '@/components/Filter/ClearFilter'
import { useQuery } from '@/hooks/useQuery'
import { useDocuments } from '@/hooks/index/useDocuments'
import type { FilterProps } from '@/components/Filter'
import { OptionsFilter } from '@/components/Filter/common/OptionsFilter'
import { CircleCheckIcon, TagIcon } from '@ttab/elephant-ui/icons'
import type { PrintFlow, PrintFlowFields } from '@/shared/schemas/printFlow'
import { fields } from '@/shared/schemas/printFlow'
import { toast } from 'sonner'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'

export const Commands = (props: FilterProps): JSX.Element => {
  if (props.page === undefined || props.pages === undefined || props.setPages === undefined || props.setSearch === undefined) {
    throw new Error('No props passed to Command component')
  }

  const { t } = useTranslation('print')

  const { data, error } = useDocuments<PrintFlow, PrintFlowFields>({
    documentType: 'tt/print-flow',
    fields
  })

  if (error) {
    toast.error(t('articles.errors.fetchFlows'))
    console.error('Could not fetch PrintFlows:', error)
  }
  const [filters, setFilters] = useQuery(['status', 'section'])
  const hasFilter = Object.values(filters).some((value) => value?.length)

  const handleClear = () => {
    setFilters({})
  }

  // TODO: don't hardcode this
  const optionsStatuses = [
    {
      value: 'draft',
      label: t('articles.status.draft')
    },
    {
      value: 'needs_proofreading',
      label: t('articles.status.needsProofreading')
    },
    {
      value: 'print_done',
      label: t('articles.status.done')
    },
    {
      value: 'usable',
      label: t('articles.status.exported')
    },
    {
      value: 'unpublished',
      label: t('articles.status.suspended')
    },
    {
      value: 'cancelled',
      label: t('articles.status.cancelled')
    }
  ]
  const optionsPrintFlows = data?.map((hit) => ({
    value: hit.id,
    label: hit.fields['document.title'].values[0]
  })) || []

  return (
    <CommandList>
      <OptionsFilter
        {...props}
        options={optionsPrintFlows}
        label={t('articles.columns.flow')}
        filterPage='printFlow'
        Icon={TagIcon}
      />
      <OptionsFilter
        {...props}
        options={optionsStatuses}
        label={t('articles.columns.status')}
        filterPage='workflowState'
        Icon={CircleCheckIcon}
      />
      <ClearFilter
        hasFilter={hasFilter}
        onClear={handleClear}
      />
    </CommandList>
  )
}
