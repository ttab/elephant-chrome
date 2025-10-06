import { Table, TableBody } from '@ttab/elephant-ui'
import type { ViewMetadata } from '@/types/index'
import { FilteredList } from './components/FilteredList'
import { UnfilteredList } from './components/unfilteredList'

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

export const ConceptOverview = ({ filter }: { filter: string }) => {
  return (
    <>
      <Table>
        <TableBody>
          {filter ? <FilteredList filter={filter} /> : <UnfilteredList />}
        </TableBody>
      </Table>
    </>
  )
}

ConceptOverview.meta = meta
