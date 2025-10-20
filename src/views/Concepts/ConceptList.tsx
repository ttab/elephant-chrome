import {
} from '@/lib/index'
import { useCallback } from 'react'
import { Table } from '@/components/Table'
import type { ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'
import { Pagination } from '@/components/Table/Pagination'
import { useSections } from '@/hooks/useSections'
import { useStories } from '@/hooks/useStories'
import { useCategories } from '@/hooks/useCategories'
import { useTable } from '@/hooks/useTable'
import type { IDBCategory, IDBConcept, IDBSection, IDBStory } from 'src/datastore/types'
import { useOrganisers } from '@/hooks/useOrganisers'

export const ConceptList = ({ columns, title }: {
  columns: ColumnDef<IDBConcept>[]
  title: string
}): JSX.Element => {
  const sections = useSections()
  const storyTags = useStories()
  const categories = useCategories()
  const organisers = useOrganisers()
  const { setData } = useTable<IDBSection | IDBStory | IDBCategory>()

  const tableDataMap = {
    Sektioner: sections,
    'Story tags': storyTags,
    Kategorier: categories,
    Organisatörer: organisers
  } as const

  const getObjects = () => {
    const data = tableDataMap[title as keyof typeof tableDataMap]
    if (data) {
      setData(data)
    }
    return data
  }

  const objects = getObjects()

  const onRowSelected = useCallback((row?: IDBConcept) => {
    if (row) {
      console.info(`Selected concept item ${row.id}`)
    } else {
      console.info('Deselected row')
    }
    return row
  }, [])


  if (objects && objects.length === 0) {
    console.error('Error fetching concept items:')
    toast.error('Kunde inte hämta concept')
  }

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
