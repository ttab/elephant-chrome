import { render } from '../setupTests'
import { Table } from '@/components/Table'
import { ModalProvider } from '@/components/Modal/ModalProvider'
import { TableProvider } from '@/contexts/TableProvider'
import type { Planning } from '@/shared/schemas/planning'
import { planningListColumns } from '@/views/PlanningOverview/PlanningListColumns'

const columns = planningListColumns({})

describe('Table', () => {
  it('renders Table', () => {
    render(
      <ModalProvider>
        <TableProvider<Planning>
          columns={columns}
          type='Plannings'
          initialState={{
            grouping: ['newsvalue']
          }}
        >
          <Table columns={columns} type='Planning' />
        </TableProvider>
      </ModalProvider>
    )
  })
})

