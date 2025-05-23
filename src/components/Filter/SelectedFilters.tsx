import { type ReactNode } from 'react'
import { Badge, Button } from '@ttab/elephant-ui'
import {
  Binoculars,
  Calendar,
  CircleCheck,
  CircleHelp,
  Contact,
  Crosshair,
  Shapes,
  SignalHigh,
  SquareCode,
  Tag,
  Users,
  X
} from '@ttab/elephant-ui/icons'
import { type DefaultValueOption } from '@/types/index'
import { useSections } from '@/hooks/useSections'
import { useWireSources } from '@/hooks/useWireSources'
import { Newsvalues } from '@/defaults/newsvalues'
import { DocumentStatuses } from '@/defaults/documentStatuses'
import { useQuery } from '@/hooks/useQuery'
import { useOrganisers } from '@/hooks/useOrganisers'
import { useCategories } from '@/hooks/useCategories'
import { useAuthors } from '@/hooks/useAuthors'
import { AssignmentTypes } from '@/defaults/assignmentTypes'

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
  const [filters, setFilters] = useQuery(['section', 'status', 'source', 'organiser', 'category', 'author', 'newsvalue', 'aType'])

  const sections = useSections().map((_) => {
    return {
      value: _.id,
      label: _.title
    }
  })

  const sources = useWireSources().map((_) => {
    return {
      value: _.uri,
      label: _.title
    }
  })

  const organisers = useOrganisers().map((_) => {
    return {
      value: _.id,
      label: _.title
    }
  })
  const categories = useCategories().map((_) => ({
    value: _.id,
    label: _.title
  }))

  const authors = useAuthors().map((_) => ({
    value: _.id,
    label: _.name
  }))

  const getOptions = (type: string) => {
    switch (type) {
      case 'section': {
        return {
          options: sections as DefaultValueOption[],
          Icon: Shapes
        }
      }
      case 'source': {
        return {
          options: sources as DefaultValueOption[],
          Icon: SquareCode
        }
      }
      case 'newsvalue': {
        return {
          options: Newsvalues,
          Icon: SignalHigh
        }
      }
      case 'query': {
        return {
          Icon: Binoculars
        }
      }
      case 'status': {
        return {
          Icon: CircleCheck,
          options: DocumentStatuses
        }
      }
      case 'organiser': {
        return {
          Icon: Contact,
          options: organisers
        }
      }
      case 'category': {
        return {
          Icon: Tag,
          options: categories
        }
      }
      case 'from': {
        return {
          Icon: Calendar,
          options: []
        }
      }
      case 'author': {
        return {
          Icon: Users,
          options: authors
        }
      }

      case 'aType': {
        return {
          Icon: Crosshair,
          options: AssignmentTypes
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

  return (
    <Button
      variant='outline'
      size='sm'
      className='h-8 border-dashed'
      onClick={() => {
        setFilters({ ...filters, [type]: undefined })
      }}
    >
      <Icon size={18} strokeWidth={1.75} className='mr-2' />
      {type === 'from' && <span className='text-xs'>sedan</span>}
      <SelectedBadge value={value} options={options} />
      <X size={18} strokeWidth={1.75} className='ml-2' />
    </Button>
  )
}

export const SelectedFilters = (): JSX.Element[] | undefined => {
  const [filters] = useQuery(['section', 'source', 'newsvalue', 'query', 'status', 'organiser', 'category', 'from', 'author', 'aType'])

  return Object.keys(filters).map((key, index) => (
    <SelectedButton key={index} type={key} value={filters[key]} />
  ))
}
