import { useContext } from 'react'
import { CoreAuthorContext } from '../datastore/contexts/CoreAuthorProvider'
import { type IDBAuthor } from '../datastore/types'

export const useAuthors = (options?: { sort?: 'name' | 'firstName' | 'lastName' }): IDBAuthor[] => {
  const { objects } = useContext(CoreAuthorContext)
  const sortKey = (['name', 'firstName', 'lastName'].includes(options?.sort || '')) ? options?.sort : 'name'

  return (objects).sort((a1, a2) => {
    if (sortKey === 'firstName') {
      const v1 = `${a1.firstName} ${a1.lastName}`.toLocaleLowerCase()
      const v2 = `${a2.firstName} ${a2.lastName}`.toLocaleLowerCase()
      return v1.localeCompare(v2)
    }

    if (sortKey === 'lastName') {
      const v1 = `${a1.lastName} ${a1.firstName}`.toLocaleLowerCase()
      const v2 = `${a2.lastName} ${a2.firstName}`.toLocaleLowerCase()
      return v1.localeCompare(v2)
    }

    // Default sorting
    return a1.name.localeCompare(a2.name)
  })
}
