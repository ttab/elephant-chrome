import { useContext } from 'react'
import { CoreCategoryContext } from '../datastore/contexts/CoreCategoryProvider'
import { type IDBCategory } from '../datastore/types'

export const useCategories = (options?: { sort?: 'title' }): IDBCategory[] => {
  const { objects } = useContext(CoreCategoryContext)

  return (objects).sort((a1, a2) => {
    return a1.title.localeCompare(a2.title)
  })
}
