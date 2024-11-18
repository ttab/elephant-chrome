import { useContext } from 'react'
import { TTWireSourceContext } from '../datastore/contexts/TTWireSourceProvider'
import { type IDBWireSource } from '../datastore/types'

export const useWireSources = (options?: { sort?: 'title' }): IDBWireSource[] => {
  const { objects } = useContext(TTWireSourceContext)

  if (options?.sort === 'title') {
    return objects.sort((s1, s2) => {
      const v1 = s1.title.trim().toLocaleLowerCase()
      const v2 = s2.title.trim().toLocaleLowerCase()
      return v1.localeCompare(v2)
    })
  }

  return objects
}
