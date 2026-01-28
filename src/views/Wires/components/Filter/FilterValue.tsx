import { Button } from '@ttab/elephant-ui'
import { XIcon } from 'lucide-react'
import { SectionFilterValue } from './Value/SectionFilterValue'
import { WireSourceFilterValue } from './Value/WireSourceFilterValue'
import { NewsvalueFilterValue } from './Value/NewsvalueFilterValue'
import { QueryFilterValue } from './Value/QueryFilterValue'
import { StatusFilterValue } from './Value/StatusFilterValue'
import { OrganiserFilterValue } from './Value/OrganiserFilterValue'
import { CategoryFilterValue } from './Value/CategoryFilterValue'
import { FromFilterValue } from './Value/FromFilterValue'
import { AuthorFilterValue } from './Value/AuthorFilterValue'
import { ATypeFilterValue } from './Value/ATypeFilterValue'

export const FilterValue = ({ type, values, onClearFilter }: {
  type: string
  values: string[]
  onClearFilter: (type: string) => void
}) => {
  if (!values.length) {
    return
  }

  return (
    <Button
      variant='outline'
      size='sm'
      className='h-8 border-dashed group hover:bg-muted/30'
      onClick={() => {
        onClearFilter(type)
      }}
    >
      <SpecificFilterValue type={type} values={values} />
      <XIcon size={22} strokeWidth={1.75} className='p-1 rounded-sm ml-2 group-hover:bg-muted' />
    </Button>
  )
}

const SpecificFilterValue = ({ type, values }: {
  type: string
  values: string[]
}) => {
  switch (type) {
    case 'core/section':
      return <SectionFilterValue values={values} />
    case 'tt/source':
      return <WireSourceFilterValue values={values} />
    case 'core/newsvalue':
      return <NewsvalueFilterValue values={values} />
    case 'query':
      return <QueryFilterValue values={values} />
    case 'status':
      return <StatusFilterValue values={values} />
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
    default:
      return null
  }
}
