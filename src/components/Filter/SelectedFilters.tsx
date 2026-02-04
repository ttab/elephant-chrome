import type { ReactNode, JSX } from 'react'
import { Badge, Button } from '@ttab/elephant-ui'
import {
  BinocularsIcon,
  CalendarIcon,
  CircleCheckIcon,
  CircleHelpIcon,
  ContactIcon,
  CrosshairIcon,
  ShapesIcon,
  SignalHighIcon,
  SquareCodeIcon,
  TagIcon,
  UsersIcon,
  XIcon
} from '@ttab/elephant-ui/icons'
import { type DefaultValueOption } from '@/types/index'
import { useSections } from '@/hooks/useSections'
import { useWireSources } from '@/hooks/useWireSources'
import { Newsvalues } from '@/defaults/newsvalues'
import { DocumentStatuses } from '@/defaults/documentStatuses'
import type { QueryParams } from '@/hooks/useQuery'
import { useQuery } from '@/hooks/useQuery'
import { useOrganisers } from '@/hooks/useOrganisers'
import { useCategories } from '@/hooks/useCategories'
import { useAuthors } from '@/hooks/useAuthors'
import { AssignmentTypes } from '@/defaults/assignmentTypes'
import { useUserTracker } from '@/hooks/useUserTracker'
import { useTranslation } from 'react-i18next'

interface SelectedBase {
  value: unknown
}

const SelectedBadge = ({ value, options }: SelectedBase & {
  options: DefaultValueOption[] | undefined
}): ReactNode => {
  const { t } = useTranslation()

  if (Array.isArray(value)) {
    if (value.length > 2) {
      return (
        <Badge
          variant='secondary'
          className='rounded-sm px-1 font-normal'
        >
          {value.length}
          {' '}
          {t('common:misc.selected')}
        </Badge>
      )
    } else {
      return value.map((v, index: number) => {
        const value = typeof v === 'string' ? options?.find((option) => option.value === v)?.value : ''
        const label = t(`core:labels.${value}`)

        return (
          <div key={index}>
            <Badge
              variant='secondary'
              className='rounded-sm px-1 font-normal mr-1'
            >
              {label || ''}
            </Badge>
          </div>
        )
      })
    }
  }
}

const SelectedButton = ({ type, value }: { value: string | string[] | undefined, type: string }): JSX.Element => {
  const [filters, setFilters] = useQuery(['section', 'status', 'source', 'organiser', 'category', 'author', 'newsvalue', 'aType'])
  const [currentFilters, setCurrentFilters] = useUserTracker<QueryParams | undefined>(`filters.Approvals.current`)
  const { t } = useTranslation()

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
          Icon: ShapesIcon
        }
      }
      case 'source': {
        return {
          options: sources as DefaultValueOption[],
          Icon: SquareCodeIcon
        }
      }
      case 'newsvalue': {
        return {
          options: Newsvalues,
          Icon: SignalHighIcon
        }
      }
      case 'query': {
        return {
          Icon: BinocularsIcon
        }
      }
      case 'status': {
        return {
          Icon: CircleCheckIcon,
          options: DocumentStatuses
        }
      }
      case 'organiser': {
        return {
          Icon: ContactIcon,
          options: organisers
        }
      }
      case 'category': {
        return {
          Icon: TagIcon,
          options: categories
        }
      }
      case 'from': {
        return {
          Icon: CalendarIcon,
          options: []
        }
      }
      case 'author': {
        return {
          Icon: UsersIcon,
          options: authors
        }
      }

      case 'aType': {
        return {
          Icon: CrosshairIcon,
          options: AssignmentTypes
        }
      }
      default: {
        return {
          options: [],
          Icon: CircleHelpIcon

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
        setCurrentFilters({ ...currentFilters, [type]: undefined })
      }}
    >
      <Icon size={18} strokeWidth={1.75} className='mr-2' />
      {type === 'from' && <span className='text-xs'>{t('common:misc.since')}</span>}
      <SelectedBadge value={value} options={options} />
      <XIcon size={18} strokeWidth={1.75} className='ml-2' />
    </Button>
  )
}

export const SelectedFilters = (): JSX.Element[] | undefined => {
  const [filters] = useQuery(['section', 'source', 'newsvalue', 'query', 'status', 'organiser', 'category', 'from', 'author', 'aType'])

  return Object.keys(filters).map((key, index) => (
    <SelectedButton key={index} type={key} value={filters[key]} />
  ))
}
