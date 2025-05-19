import { type ReactNode } from 'react'
import { Badge, Button } from '@ttab/elephant-ui'
import {
  CircleCheck,
  CircleHelp,
  Tag,
  X
} from '@ttab/elephant-ui/icons'
import { type DefaultValueOption } from '@/types/index'
import { PrintArticleStatuses } from '@/defaults/documentStatuses'
import { useQuery } from '@/hooks/useQuery'
import { useDocuments } from '@/hooks/index/useDocuments'
import { type PrintFlow, type PrintFlowFields, fields } from '@/hooks/index/useDocuments/schemas/printFlow'
import { toast } from 'sonner'

interface SelectedBase {
  value: unknown
}

const SelectedBadge = ({ value, options }: SelectedBase & {
  options: DefaultValueOption[] | undefined
}): ReactNode => {
  if (Array.isArray(value)) {
    if (value.length > 2) {
      return (
        <Badge
          variant='secondary'
          className='rounded-sm px-1 font-normal'
        >
          {value.length}
          {' '}
          selected
        </Badge>
      )
    } else {
      return value.map((v, index: number) => {
        return (
          <div key={index}>
            <Badge
              variant='secondary'
              className='rounded-sm px-1 font-normal mr-1'
            >
              {typeof v === 'string' ? options?.find((option) => option.value === v)?.label || v : ''}
            </Badge>
          </div>
        )
      })
    }
  }
}

const SelectedButton = ({ type, value }: { value: string | string[] | undefined, type: string }): JSX.Element => {
  const [filters, setFilters] = useQuery(['workflowState', 'printFlow'])

  const { data, error } = useDocuments<PrintFlow, PrintFlowFields>({
    documentType: 'tt/print-flow',
    fields
  })

  if (error) {
    toast.error('Kunde inte hämta printflöden')
    console.error('Could not fetch PrintFlows:', error)
  }

  const printFlows = data?.map((hit) => ({
    value: hit.id,
    label: hit.fields['document.title'].values[0]
  })) || []

  const getOptions = (type: string) => {
    switch (type) {
      case 'workflowState': {
        return {
          Icon: CircleCheck,
          options: PrintArticleStatuses
        }
      }
      case 'printFlow': {
        return {
          Icon: Tag,
          options: printFlows
        }
      }
      default: {
        return {
          options: [],
          Icon: CircleHelp

        }
      }
    }
  }

  const { options, Icon } = getOptions(type)

  return type !== 'from'
    ? (
        <Button
          variant='outline'
          size='sm'
          className='h-8 border-dashed'
          onClick={() => {
            setFilters({ ...filters, [type]: undefined })
          }}
        >
          <Icon size={18} strokeWidth={1.75} className='mr-2' />
          <SelectedBadge value={value} options={options} />
          <X size={18} strokeWidth={1.75} className='ml-2' />
        </Button>
      )
    : <span />
}

export const SelectedFilters = (): JSX.Element[] | undefined => {
  const [filters] = useQuery(['section', 'source', 'newsvalue', 'query', 'status', 'organiser', 'category', 'from', 'author', 'aType', 'printFlow', 'workflowState'])

  return Object.keys(filters).map((key, index) => (
    <SelectedButton key={index} type={key} value={filters[key]} />
  ))
}
