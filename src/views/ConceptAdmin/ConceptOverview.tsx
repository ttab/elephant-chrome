import { Table, TableBody, TableCell, TableRow } from '@ttab/elephant-ui'
import { Concepts } from './ConceptTypes'
import { useLink } from '@/hooks/useLink'
import type { ViewMetadata } from '@/types/index'


const meta: ViewMetadata = {
  name: 'Factboxes',
  path: `${import.meta.env.BASE_URL}/factboxes`,
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
  console.log(Concepts)

  const handleOpen = useLink('Concepts')


  const conceptList = () => {
    return Concepts.map((concept, i) => {
      return (
        <TableRow
          onClick={() => {
            handleOpen(undefined, {})
          }}
          key={i}
        >
          <TableCell>{concept.label}</TableCell>
          <TableCell>{concept.description}</TableCell>
        </TableRow>
      )
    })
  }
  return (
    <>
      <Table>
        <TableBody>
          {conceptList()}
        </TableBody>
      </Table>
    </>
  )
}

ConceptOverview.meta = meta
