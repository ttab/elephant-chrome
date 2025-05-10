import { useRegistry } from '@/hooks'
import { Table } from '@/components/Table'
import type { ColumnDef } from '@tanstack/react-table'
import { Error as ErrorView } from '../Error'
import { useDocuments } from '@/hooks/index/useDocuments'
import { constructQuery } from '@/hooks/index/useDocuments/queries/views/assignments'
import { fields } from '@/hooks/index/useDocuments/schemas/assignments'
import type { Assignment, AssignmentFields } from '@/hooks/index/useDocuments/schemas/assignments'
import { getUTCDateRange } from '@/lib/datetime'
import { SortingV1 } from '@ttab/elephant-api/index'

export const AssignmentsList = ({ columns, date }: {
  columns: Array<ColumnDef<Assignment>>
  date: Date
}): JSX.Element => {
  const { timeZone } = useRegistry()

  const { from, to } = getUTCDateRange(date, timeZone)
  const { error } = useDocuments<Assignment, AssignmentFields>({
    documentType: 'core/planning-item',
    query: constructQuery({ from, to }),
    fields,
    sort: [
      SortingV1.create({ field: 'document.meta.core_newsvalue.value', desc: true })
    ],
    options: {
      aggregatePages: true,
      asAssignments: true,
      setTableData: true
    }
  })

  if (error) {
    <ErrorView message={error.message} />
  }

  return (
    <Table
      type='Planning'
      columns={columns}
      onRowSelected={(row): void => {
        if (row) {
          console.info(`Selected assignment item ${row.id}`)
        } else {
          console.info('Deselected row')
        }
      }}
    />
  )
}
