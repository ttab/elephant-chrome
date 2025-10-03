import { Table, TableBody, TableCell, TableRow } from '@ttab/elephant-ui'
import { Concepts } from './ConceptTypes'
import { useLink } from '@/hooks/useLink'
import type { ViewMetadata } from '@/types/index'

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
  const handleOpen = useLink('Concepts')
  const conceptList = () => {
    return Concepts.map((concept, i) => {
      console.log(concept.label)
      const Icon = concept.icon
      return (
        <TableRow
          className='border-2 border-amber-900'
          onClick={() => {
            handleOpen(undefined, { documentType: concept.path, title: concept.label })
          }}
          key={i}
        >
          <TableCell>
            {' '}
            <Icon
              className='ml-auto'
              size={24}
              strokeWidth={1.75}
            />
          </TableCell>
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
