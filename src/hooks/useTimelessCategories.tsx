import { useContext } from 'react'
import { CoreTimelessCategoryContext } from '../datastore/contexts/CoreTimelessCategoryProvider'
import { type IDBTimelessCategory } from '../datastore/types'

export const useTimelessCategories = (): IDBTimelessCategory[] => {
  const { objects } = useContext(CoreTimelessCategoryContext)

  return [...objects].sort((a1, a2) => a1.title.localeCompare(a2.title))
}
