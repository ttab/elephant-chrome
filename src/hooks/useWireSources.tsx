import { useContext } from 'react'
import { TTWireSourceContext } from '../datastore/contexts/TTWireSourceProvider'
import { type IDBWireSource } from '../datastore/types'
import { getActiveOnly } from '@/lib/getActiveOnly'

export const useWireSources = (options?: { sort?: 'title', activeOnly: boolean }): IDBWireSource[] => {
  let { objects } = useContext(TTWireSourceContext)

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
