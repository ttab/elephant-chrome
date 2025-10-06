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

export const ConceptOverview = ({ filter }: { filter: string }) => {
  const handleOpen = useLink('Concepts')
  const displayConceptList = () => {
    if (filter) {
      return Concepts.filter((concept) => concept.label.startsWith(filter) || concept.description.includes(filter)).map((concept, i) => {
        const Icon = concept.icon
        return (
          <TableRow
            onClick={() => {
              handleOpen(undefined, { documentType: concept.path, title: concept.label })
            }}
            key={i}
          >
            <TableCell className='w-4'>
              {' '}
              <Icon
                size={24}
                strokeWidth={1.75}
              />
            </TableCell>
            <TableCell>{concept.label}</TableCell>
            <TableCell>{concept.description}</TableCell>
          </TableRow>
        )
      })
    } else {
      return Concepts.map((concept, i) => {
        const Icon = concept.icon
        return (
          <TableRow
            onClick={() => {
              handleOpen(undefined, { documentType: concept.path, title: concept.label })
            }}
            key={i}
          >
            <TableCell className='w-4'>
              {' '}
              <Icon
                size={20}
                strokeWidth={1.75}
              />
            </TableCell>
            <TableCell>{concept.label}</TableCell>
            <TableCell>{concept.description}</TableCell>
          </TableRow>
        )
      })
    }
  }
  return (
    <>
      <Table>
        <TableBody>
          {displayConceptList()}
        </TableBody>
      </Table>
    </>
  )
}

ConceptOverview.meta = meta
