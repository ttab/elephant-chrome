import { useContext } from 'react'
import { CoreCategoryContext } from '../datastore/contexts/CoreCategoryProvider'
import { type IDBCategory } from '../datastore/types'
import { getActiveOnly } from '@/lib/getActiveOnly'

export const useCategories = (options?: { activeOnly: boolean }): IDBCategory[] => {
  let { objects } = useContext(CoreCategoryContext)
  const getActive = options?.activeOnly ?? true

  if (getActive) {
    objects = getActiveOnly(objects)
  }

  return (objects).sort((a1, a2) => {
    return a1.title.localeCompare(a2.title)
  })
}
