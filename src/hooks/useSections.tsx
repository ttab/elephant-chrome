import { useContext } from 'react'
import { CoreSectionContext } from '../datastore/contexts/CoreSectionProvider'
import { type IDBSection } from '../datastore/types'
import { getActiveOnly } from '@/lib/getActiveOnly'

export const useSections = (
  { sort, activeOnly = true }: {
    sort?: 'title'
    activeOnly?: boolean } = {}): IDBSection[] => {
  let { objects } = useContext(CoreSectionContext)

  if (activeOnly) {
    objects = getActiveOnly(objects)
  }

  if (sort === 'title') {
    objects.sort((s1, s2) => {
      const v1 = s1.title.trim().toLocaleLowerCase()
      const v2 = s2.title.trim().toLocaleLowerCase()
      return v1.localeCompare(v2)
    })
  }

  return objects
}
