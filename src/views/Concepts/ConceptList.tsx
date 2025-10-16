import {
} from '@/lib/index'
import { useCallback } from 'react'
import { Table } from '@/components/Table'
import type { ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'

import type { Concept } from '@/shared/schemas/conceptSchemas/baseConcept'
import { Pagination } from '@/components/Table/Pagination'
import { useSections } from '@/hooks/useSections'
import { useStories } from '@/hooks/useStories'
import { useCategories } from '@/hooks/useCategories'
import { useTable } from '@/hooks/useTable'
import { IDBCategory, IDBSection, IDBStory } from 'src/datastore/types'

export const ConceptList = ({ columns, documentType, title }: {
  columns: ColumnDef<Concept>[]
  documentType: string
  title: string
}): JSX.Element => {
  const sections = useSections()
  const storyTags = useStories()
  const categories = useCategories()
  const { setData } = useTable<IDBSection | IDBStory | IDBCategory>()


  const tableDataMap = {
    Sektioner: sections,
    'Story tags': storyTags,
    Kategorier: categories
  } as const

  const getObjects = () => {
    const data = tableDataMap[title as keyof typeof tableDataMap]
    if (data) {
      setData(data)
    }
    return data
  }

  const objects = getObjects()

  const onRowSelected = useCallback((row?: Concept) => {
    if (row) {
      console.info(`Selected concept item ${row.id}`)
    } else {
      console.info('Deselected row')
    }
    return row
  }, [])


  if (objects.length === 0) {
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
