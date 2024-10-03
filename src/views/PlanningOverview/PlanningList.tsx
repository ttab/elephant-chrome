import { useCallback, useMemo } from 'react'
import useSWR from 'swr'
import { useSections, useRepositoryEvents } from '@/hooks'
import {
  type Planning
} from '@/lib/index'

import { Table } from '@/components/Table'
import { planningTableColumns } from '@/views/PlanningOverview/PlanningListColumns'

export const PlanningList = ({ from, to }: {
  from: string
  to: string
}): JSX.Element => {
  const sections = useSections()


  const { mutate, error } = useSWR(['Plannings', from, to, { withStatus: true }])
  const columns = useMemo(() => planningTableColumns({ sections }), [sections])

  // FIXME: This should be supported by the useRepositoryEvents hook
  // but isn't working right now. The message goes only to the leader tab
  useRepositoryEvents(
    'core/planning-item',
    useCallback(() => {
      void (async () => {
        try {
          await mutate()
        } catch (error) {
          console.error('Error when mutating Planning list', error)
        }
      })()
    }, [mutate])
  )

  const onRowSelected = useCallback((row?: Planning) => {
    if (row) {
      console.info(`Selected planning item ${row._id}`)
    } else {
      console.info('Deselected row')
    }
    return row
  }, [])


  if (error) {
    return <pre>{error.message}</pre>
  }

  return (
    <>
      <Table
        type='Planning'
        columns={columns}
        onRowSelected={onRowSelected}
        />
    </>
  )
}
