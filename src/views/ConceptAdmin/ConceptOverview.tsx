import { Table, TableBody } from '@ttab/elephant-ui'
import type { ViewMetadata } from '@/types/index'
import { FilteredList } from './components/FilteredList'
import { UnfilteredList } from './components/UnfilteredList'
import { useQuery } from '@/hooks/useQuery'
import { Toolbar } from '@/components/Table/Toolbar'

const meta: ViewMetadata = {
  name: 'Concepts',
  path: `${import.meta.env.BASE_URL}/concepts`,
  widths: {
    sm: 12,
    md: 12,
    lg: 6,
    xl: 6,
    '2xl': 6,
    hd: 6,
    fhd: 4,
    qhd: 3,
    uhd: 2
  }
}

export const ConceptOverview = () => {
  const [filter] = useQuery(['query'])
  return (
    <>
      <Toolbar searchbar={true} searchPlaceholder='Fritextsökning' quickFilter={false} filter={false} />
      <Table>
        <TableBody>
          {filter.query ? <FilteredList filter={filter.query[0]} /> : <UnfilteredList />}
        </TableBody>
      </Table>
    </>
  )
}

ConceptOverview.meta = meta
