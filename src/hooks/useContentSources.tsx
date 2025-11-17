import { useContext } from 'react'
import { CoreContentSourceContext } from '../datastore/contexts/CoreContentSourceProvider'
import { type IDBContentSource } from '../datastore/types'
import { getActiveOnly } from '@/lib/getActiveOnly'

export const useContentSources = (options?: { sort?: 'title', activeOnly: boolean }): IDBContentSource[] => {
  let { objects } = useContext(CoreContentSourceContext)
  const getActive = options?.activeOnly ?? true

  if (getActive) {
    objects = getActiveOnly(objects)
  }

  if (options?.sort === 'title') {
    return objects.sort((s1, s2) => {
      const v1 = s1.title.trim().toLocaleLowerCase()
      const v2 = s2.title.trim().toLocaleLowerCase()
      return v1.localeCompare(v2)
    })
  }

  return objects
}
