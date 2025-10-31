import {
} from '@/lib/index'
import { useCallback, useEffect } from 'react'
import { Table } from '@/components/Table'
import type { ColumnDef } from '@tanstack/react-table'
import { Pagination } from '@/components/Table/Pagination'
import { useSections } from '@/hooks/useSections'
import { useStories } from '@/hooks/useStories'
import { useCategories } from '@/hooks/useCategories'
import { useTable } from '@/hooks/useTable'
import type { IDBCategory, IDBConcept, IDBOrganiser, IDBSection, IDBStory } from 'src/datastore/types'
import { useOrganisers } from '@/hooks/useOrganisers'
import { LoadingText } from '@/components/LoadingText'

export const ConceptList = ({ columns, title }: {
  columns: ColumnDef<IDBConcept>[]
  title: string
}): JSX.Element => {
  const sections = useSections({ activeOnly: false })
  const storyTags = useStories()
  const categories = useCategories()
  const organisers = useOrganisers()
  const { setData } = useTable<IDBSection | IDBStory | IDBCategory | IDBOrganiser>()
  let objects: (IDBSection | IDBStory | IDBCategory | IDBOrganiser)[] | string = []

  const tableDataMap = {
    Sektioner: sections,
    'Story tags': storyTags,
    Kategorier: categories,
    Organisatörer: organisers
  } as const

  const getObjects = () => {
    const data = tableDataMap[title as keyof typeof tableDataMap]
    if (data && data.length > 0) {
      setData(data)
      return data
    } else {
      return 'No data found'
    }
  }

  useEffect(() => {
    objects = getObjects()
  }, [title])

  const onRowSelected = useCallback((row?: IDBConcept) => {
    if (row) {
      console.info(`Selected concept item ${row.id}`)
    } else {
      console.info('Deselected row')
    }
    return row
  }, [])


  if (objects && typeof objects === 'string') {
    return (
      <LoadingText className='mt-8'>
        {objects}
      </LoadingText>
    )
  } else {
    return (
      <>
        <Table
          type='Concept'
          columns={columns}
          onRowSelected={onRowSelected}
        />
        <Pagination total={objects?.length || 0} />
      </>
    )
  }
}
