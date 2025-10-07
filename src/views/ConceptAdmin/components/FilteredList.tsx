import { TableCell, TableRow } from '@ttab/elephant-ui'
import { Concepts } from '../ConceptTypes'
import { useLink } from '@/hooks/useLink'


export const FilteredList = ({ filter }: { filter: string }) => {
  const handleOpen = useLink('Concepts')
  return Concepts.filter((concept) => concept.label.startsWith(filter) || concept.description.includes(filter)).map((concept) => {
    const Icon = concept.icon
    return (
      <TableRow
        onClick={() => {
          handleOpen(undefined, { documentType: concept.path, title: concept.label })
        }}
        key={concept.label}
      >
        <TableCell className='w-4'>
          {' '}
          <Icon
            size={20}
            strokeWidth={1.75}
          />
        </TableCell>
        <TableCell className='w-fit'>{concept.label}</TableCell>
        <TableCell>{concept.description}</TableCell>
      </TableRow>
    )
  })
}
