import { useContext } from 'react'
import { CoreOrganiserContext } from '../datastore/contexts/CoreOrganiserProvider'
import { type IDBOrganiser } from '../datastore/types'

export const useOrganisers = (): IDBOrganiser[] => {
  const { objects } = useContext(CoreOrganiserContext)

  return (objects).sort((a1, a2) => {
    return a1.title.localeCompare(a2.title)
  })
}
