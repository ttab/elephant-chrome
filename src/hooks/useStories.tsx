import { useContext } from 'react'
import { CoreStoryContext } from '../datastore/contexts/CoreStoryProvider'
import { type IDBStory } from '../datastore/types'

export const useStories = (
  { sort, activeOnly = true }: {
    sort?: 'title'
    activeOnly?: boolean } = {}): IDBStory[] => {
  const { objects } = useContext(CoreStoryContext)

  if (sort === 'title') {
    return objects.sort((s1, s2) => {
      const v1 = s1.title.trim().toLocaleLowerCase()
      const v2 = s2.title.trim().toLocaleLowerCase()
      return v1.localeCompare(v2)
    })
  }

  if (activeOnly) {
    const filteredObjects = objects.filter((item) => item.usableVersion && item.usableVersion > 0)
    return filteredObjects
  }

  return objects
}
