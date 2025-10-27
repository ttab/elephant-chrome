import {
} from '@/lib/index'
import { useCallback } from 'react'
import { Table } from '@/components/Table'
import type { ColumnDef } from '@tanstack/react-table'
import { Pagination } from '@/components/Table/Pagination'
import { useSections } from '@/hooks/useSections'
import { useStories } from '@/hooks/useStories'
import { useCategories } from '@/hooks/useCategories'
import { useTable } from '@/hooks/useTable'
import type { IDBCategory, IDBConcept, IDBOrganiser, IDBSection, IDBStory } from 'src/datastore/types'
import { useOrganisers } from '@/hooks/useOrganisers'
import type { ViewType } from '@/types/index'
import { LoadingText } from '@/components/LoadingText'

export const ConceptList = ({ columns, title }: {
  columns: ColumnDef<IDBConcept>[]
  title: string
}): JSX.Element => {
  const sections = useSections()
  const storyTags = useStories()
  const categories = useCategories()
  const organisers = useOrganisers()
  const { setData } = useTable<IDBSection | IDBStory | IDBCategory | IDBOrganiser>()
  const tableDataMap = {
    Sektioner: {
      conceptTitle: 'Sektion',
      data: sections,
      conceptView: 'Section'
    },
    'Story tags': {
      conceptTitle: 'Story Tag',
      data: storyTags,
      conceptView: 'StoryTag'
    },
    Kategorier: {
      conceptTitle: 'Kategori',
      data: categories,
      conceptView: 'Category'
    },
    Organisatörer: {
      conceptTitle: 'Organisatör',
      data: organisers,
      conceptView: 'Organiser'
    }
  } as const


  const getObjects = () => {
    const data = tableDataMap[title as keyof typeof tableDataMap]
    if (data.data && data.data.length > 0) {
      setData(data.data)
      return data
    } else {
      return 'No data found'
    }
  }

  const conceptData = getObjects()
  const onRowSelected = useCallback((row?: IDBConcept) => {
    if (row) {
      console.info(`Selected concept item ${row.id}`)
    } else {
      console.info('Deselected row')
    }
    return row
  }, [])


  if (conceptData && typeof conceptData === 'string') {
    return (
      <LoadingText className='mt-8'>
        {conceptData}
      </LoadingText>
    )
  } else {
    return (
      <>
        <Table
          type={conceptData.conceptView as ViewType}
          columns={columns}
          onRowSelected={onRowSelected}
        />
        <Pagination total={conceptData.data?.length || 0} />
      </>
    )
  }
}
