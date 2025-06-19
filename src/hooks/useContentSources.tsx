import { useContext } from 'react'
import { CoreContentSourceContext } from '../datastore/contexts/CoreContentSourceProvider'
import { type IDBContentSource } from '../datastore/types'

export const useContentSources = (options?: { sort?: 'title' }): IDBContentSource[] => {
  const { objects } = useContext(CoreContentSourceContext)

  if (options?.sort === 'title') {
    return objects.sort((s1, s2) => {
      const v1 = s1.title.trim().toLocaleLowerCase()
      const v2 = s2.title.trim().toLocaleLowerCase()
      return v1.localeCompare(v2)
    })
  }

  return objects
}
