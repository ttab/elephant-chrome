import { XIcon } from '@ttab/elephant-ui/icons'
import { SectionFilterValue } from './Value/SectionFilterValue'
import { WireSourceFilterValue } from './Value/WireSourceFilterValue'
import { NewsvalueFilterValue } from './Value/NewsvalueFilterValue'
import { QueryFilterValue } from './Value/QueryFilterValue'
import { StatusFilterValue } from './Value/StatusFilterValue'
import { WireStatusFilterValue } from './Value/WireStatusFilterValue'
import { OrganiserFilterValue } from './Value/OrganiserFilterValue'
import { CategoryFilterValue } from './Value/CategoryFilterValue'
import { FromFilterValue } from './Value/FromFilterValue'
import { AuthorFilterValue } from './Value/AuthorFilterValue'
import { ATypeFilterValue } from './Value/ATypeFilterValue'
import { AdvancedSearchFilterValue } from './Value/AdvancedSearchFilterValue'

export const FilterValue = ({ type, values, onClearFilter, onEditFilter }: {
  type: string
  values: string[]
  onClearFilter: (type: string) => void
  onEditFilter?: (type: string) => void
}) => {
  if (!values.length) {
    return
  }

  return (
    <div className='flex items-center h-8 border border-dashed rounded-md group hover:bg-muted/30'>
      <button
        type='button'
        onClick={() => onEditFilter?.(type)}
        className='flex items-center px-2 text-sm'
      >
        <SpecificFilterValue type={type} values={values} />
      </button>
      <button
        type='button'
        onClick={(e) => {
          e.stopPropagation()
          onClearFilter(type)
        }}
        className='flex items-center pr-1.5'
      >
        <XIcon size={22} strokeWidth={1.75} className='p-1 rounded-sm group-hover:bg-muted' />
      </button>
    </div>
  )
}

const SpecificFilterValue = ({ type, values }: {
  type: string
  values: string[]
}) => {
  switch (type) {
    case 'core/section':
      return <SectionFilterValue values={values} />
    case 'core/source':
      return <WireSourceFilterValue values={values} />
    case 'core/newsvalue':
      return <NewsvalueFilterValue values={values} />
    case 'query':
      return <QueryFilterValue values={values} />
    case 'status':
      return <StatusFilterValue values={values} />
    case 'wireStatus':
      return <WireStatusFilterValue values={values} />
    case 'core/organiser':
      return <OrganiserFilterValue values={values} />
    case 'core/category':
      return <CategoryFilterValue values={values} />
    case 'from':
      return <FromFilterValue values={values} />
    case 'core/author':
      return <AuthorFilterValue values={values} />
    case 'aType':
      return <ATypeFilterValue values={values} />
    case 'advancedSearch':
      return <AdvancedSearchFilterValue values={values} />
    default:
      return null
  }
}
