import { TableCell, TableRow } from '@ttab/elephant-ui'
import { Concepts } from './ConceptTypes'
import { useLink } from '@/hooks/useLink'


export const ConceptsList = ({ filter }: { filter?: string }) => {
  const handleOpen = useLink('Concepts')
  const refinedFilter = filter && filter.toLowerCase()

  const data = refinedFilter
    ? Concepts.filter((concept) => concept.label.toLowerCase().startsWith(refinedFilter)
      || concept.description.includes(refinedFilter))
    : Concepts

  return data.map((concept) => {
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
