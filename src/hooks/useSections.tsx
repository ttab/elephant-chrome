import { useContext } from 'react'
import { CoreSectionContext } from '../datastore/contexts/CoreSectionProvider'
import { type IDBSection } from '../datastore/types'
import { getActiveOnly } from '@/lib/getActiveOnly'

export const useSections = (options?: { sort?: 'title', activeOnly: boolean }): IDBSection[] => {
  let { objects } = useContext(CoreSectionContext)
  const getActive = options?.activeOnly ?? true

  if (getActive) {
    objects = getActiveOnly(objects)
  }

  if (options?.sort === 'title') {
    objects.sort((s1, s2) => {
      const v1 = s1.title.trim().toLocaleLowerCase()
      const v2 = s2.title.trim().toLocaleLowerCase()
      return v1.localeCompare(v2)
    })
  }

  return objects
}
