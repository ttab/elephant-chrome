import { CommandList } from '@ttab/elephant-ui'
import { ClearFilter } from '@/components/Filter/ClearFilter'
import { useQuery } from '@/hooks/useQuery'
import { useDocuments } from '@/hooks/index/useDocuments'
import type { FilterProps } from '@/components/Filter'
import { OptionsFilter } from '@/components/Filter/common/OptionsFilter'
import { CircleCheck, Tag } from '@ttab/elephant-ui/icons'
import type { PrintFlow, PrintFlowFields } from '@/hooks/index/useDocuments/schemas/printFlow'
import { fields } from '@/hooks/index/useDocuments/schemas/printFlow'
import { toast } from 'sonner'

export const Commands = (props: FilterProps): JSX.Element => {
  if (props.page === undefined || props.pages === undefined || props.setPages === undefined || props.setSearch === undefined) {
    throw new Error('No props passed to Command component')
  }

  const { data, error } = useDocuments<PrintFlow, PrintFlowFields>({
    documentType: 'tt/print-flow',
    fields
  })

  if (error) {
    toast.error('Kunde inte hämta printflöden')
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
      label: 'Utkast'
    },
    {
      value: 'needs_proofreading',
      label: 'Klar för korr'
    },
    {
      value: 'print_done',
      label: 'Klar'
    },
    {
      value: 'usable',
      label: 'Exporterad'
    },
    {
      value: 'unpublished',
      label: 'Inställd'
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
        label='Flöde'
        filterPage='printFlow'
        Icon={Tag}
      />
      <OptionsFilter
        {...props}
        options={optionsStatuses}
        label='Status'
        filterPage='workflowState'
        Icon={CircleCheck}
      />
      <ClearFilter
        hasFilter={hasFilter}
        onClear={handleClear}
      />
    </CommandList>
  )
}
