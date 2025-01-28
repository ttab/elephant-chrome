import { type ReactNode } from 'react'
import { Badge, Button } from '@ttab/elephant-ui'
import { CircleCheck, Shapes, X } from '@ttab/elephant-ui/icons'
import { type DefaultValueOption } from '@/types/index'
import { useFilter } from '@/hooks/useFilter'
import { DocumentStatuses } from '@/defaults/documentStatuses'
import { useSections } from '@/hooks/useSections'

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

const SelectedButton = ({ type, value }: { value: string[], type: string }): JSX.Element => {
  const [filters, setFilters] = useFilter(['section', 'status'])
  const sections = useSections().map((_) => {
    return {
      value: _.id,
      label: _.title
    }
  })

  const getOptions = (type: string) => {
    switch (type) {
      case 'section': {
        return {
          options: sections as DefaultValueOption[],
          Icon: Shapes
        }
      }
      case 'status': {
        return {
          options: DocumentStatuses,
          Icon: CircleCheck
        }
      }
      default: {
        return {
          options: [],
          Icon: Shapes

        }
      }
    }
  }

  const { options, Icon } = getOptions(type)

  return (
    <Button
      variant='outline'
      size='sm'
      className='h-8 border-dashed'
      onClick={() => {
        setFilters({ ...filters, [type]: [] })
      }}
    >
      <Icon size={18} strokeWidth={1.75} className='mr-2' />
      <SelectedBadge value={value} options={options} />
      <X size={18} strokeWidth={1.75} className='ml-2' />
    </Button>
  )
}

export const SelectedFilters = (): JSX.Element[] | undefined => {
  const [filters] = useFilter(['section', 'status'])

  return Object.keys(filters).map((key, index) => (
    <SelectedButton key={index} type={key} value={filters[key]} />
  ))
}
