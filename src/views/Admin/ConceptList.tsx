import { TableCell, TableRow } from '@ttab/elephant-ui'
import { useLink } from '@/hooks/useLink'
import { tableDataMap } from '../Concepts/lib/conceptDataTable'
import { useTable } from '@/hooks/useTable'


export const ConceptsList = () => {
  const handleOpen = useLink('Concepts')
  const { table } = useTable()
  const { globalFilter } = table.getState() as {
    globalFilter: string
  }
  const refinedFilter = globalFilter && globalFilter.toLowerCase()
  const data = refinedFilter
    ? Object.fromEntries(
      Object.entries(tableDataMap).filter(([_, concept]) =>
        concept.label.toLowerCase().startsWith(refinedFilter)
        || concept.description.toLowerCase().includes(refinedFilter)
      )
    )
    : tableDataMap

  return Object.values(data).map((concept) => {
    const Icon = concept.icon
    return (
      <TableRow
        onClick={() => {
          handleOpen(undefined, { documentType: concept.documentType, title: concept.label })
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
