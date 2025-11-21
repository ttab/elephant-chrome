import { Table, TableBody } from '@ttab/elephant-ui'
import type { ViewMetadata } from '@/types/index'
import { Toolbar } from '@/components/Table/Toolbar'
import { ConceptsList } from './ConceptList'

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
  return (
    <>
      <Toolbar searchbar={true} searchPlaceholder='Fritextsökning' quickFilter={false} filter={false} />
      <Table>
        <TableBody>
          <ConceptsList />
        </TableBody>
      </Table>
    </>
  )
}

ConceptOverview.meta = meta
