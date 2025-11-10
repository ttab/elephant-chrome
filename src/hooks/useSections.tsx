import { useContext } from 'react'
import { CoreSectionContext } from '../datastore/contexts/CoreSectionProvider'
import { type IDBSection } from '../datastore/types'

export const useSections = (
  { sort, activeOnly = true }: {
    sort?: 'title'
    activeOnly?: boolean } = {}): IDBSection[] => {
  const { objects } = useContext(CoreSectionContext)

  if (sort === 'title') {
    objects.sort((s1, s2) => {
      const v1 = s1.title.trim().toLocaleLowerCase()
      const v2 = s2.title.trim().toLocaleLowerCase()
      return v1.localeCompare(v2)
    })
  }

  if (activeOnly) {
    const filteredObjects = objects.filter((item) => item.usableVersion && item.usableVersion > 0)
    console.log(filteredObjects)
    return filteredObjects
  }
  return objects
}
