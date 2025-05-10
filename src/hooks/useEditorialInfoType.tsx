import { useContext } from 'react'
import { TTEditorialInfoTypeContext } from '../datastore/contexts/TTEditorialInfoTypeProvider'
import { type IDBEditorialInfoType } from '../datastore/types'

export const useEditorialInfoTypes = (options?: { sort?: 'title' }): IDBEditorialInfoType[] => {
  const { objects } = useContext(TTEditorialInfoTypeContext)

  if (options?.sort === 'title') {
    return objects.sort((s1, s2) => {
      const v1 = s1.title.trim().toLocaleLowerCase()
      const v2 = s2.title.trim().toLocaleLowerCase()
      return v1.localeCompare(v2)
    })
  }

  return objects
}
