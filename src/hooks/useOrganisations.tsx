import { useContext } from 'react'
import { CoreOrganisationContext } from '../datastore/contexts/CoreOrganisationProvider'
import { type IDBOrganisation } from '../datastore/types'

export const useOrganisations = (): IDBOrganisation[] => {
  const { objects } = useContext(CoreOrganisationContext)

  return (objects).sort((a1, a2) => {
    return a1.title.localeCompare(a2.title)
  })
}
