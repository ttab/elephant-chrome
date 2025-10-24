import { useContext } from 'react'
import { CoreSectionContext } from '../datastore/contexts/CoreSectionProvider'
import { type IDBSection } from '../datastore/types'

export const useSections = (options?: { sort?: 'title' }): IDBSection[] => {
  const { objects } = useContext(CoreSectionContext)

  if (options?.sort === 'title') {
    return objects.sort((s1, s2) => {
      const v1 = s1.title.trim().toLocaleLowerCase()
      const v2 = s2.title.trim().toLocaleLowerCase()
      return v1.localeCompare(v2)
    })
  }

  return objects
}
