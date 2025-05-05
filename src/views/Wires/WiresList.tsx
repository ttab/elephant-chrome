import { useCallback, useRef } from 'react'
import { useQuery, useRegistry, useRepositoryEvents } from '@/hooks'

import { Table } from '@/components/Table'
import type { WireFields } from '@/hooks/index/useDocuments/schemas/wire'
import { fields, type Wire } from '@/hooks/index/useDocuments/schemas/wire'
import type { ColumnDef } from '@tanstack/react-table'
import { Toolbar } from './Toolbar'
import { useDocuments } from '@/hooks/index/useDocuments'
import { constructQuery } from '@/hooks/index/useDocuments/queries/views/wires'
import { SortingV1 } from '@ttab/elephant-api/index'
import * as handlers from './lib/handlers'
import { useSession } from 'next-auth/react'

export const WireList = ({ columns }: {
  columns: ColumnDef<Wire, unknown>[]
}): JSX.Element => {
  const [{ page }] = useQuery()
  const [filter] = useQuery(['section', 'source', 'query', 'newsvalue'])
  const { data: session } = useSession()
  const { repository } = useRegistry()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { data, mutate } = useDocuments<Wire, WireFields>({
    documentType: 'tt/wire',
    size: 40,
    query: constructQuery(filter),
    page: typeof page === 'string'
      ? parseInt(page)
      : undefined,
    fields,
    sort: [
      SortingV1.create({ field: 'modified', desc: true })
    ],
    options: {
      setTableData: true
    }
  })

  useRepositoryEvents(['tt/wire', 'tt/wire+meta'], (event) => {
    if (event.event !== 'document' && event.event !== 'status' && event.event !== 'delete_document') {
      return
    }

    // Optimistic update and eventually revalidation of new documents
    if (event.event === 'document') {
      void handlers.handleDocumentEvent({
        event,
        session,
        repository,
        source: filter?.source,
        data,
        mutate,
        timeoutRef
      })
    }

    // Optimistic update and eventually revalidation of statuses
    if (event.event === 'status') {
      void handlers.handleStatusEvent({
        event,
        data,
        mutate,
        timeoutRef
      })
    }
  })

  const onRowSelected = useCallback((row?: Wire) => {
    if (row) {
      console.info(`Selected planning item ${row.id}`)
    } else {
      console.info('Deselected row')
    }
    return row
  }, [])

  return (
    <>
      <Toolbar />
      <Table
        type='Wires'
        columns={columns}
        onRowSelected={onRowSelected}
      />
    </>
  )
}
