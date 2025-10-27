import { useContext } from 'react'
import { CoreStoryContext } from '../datastore/contexts/CoreStoryProvider'
import { type IDBStory } from '../datastore/types'

export const useStories = (options?: { sort?: 'title' }): IDBStory[] => {
  const { objects } = useContext(CoreStoryContext)

  if (options?.sort === 'title') {
    return objects.sort((s1, s2) => {
      const v1 = s1.title.trim().toLocaleLowerCase()
      const v2 = s2.title.trim().toLocaleLowerCase()
      return v1.localeCompare(v2)
    })
  }

  return objects
}
