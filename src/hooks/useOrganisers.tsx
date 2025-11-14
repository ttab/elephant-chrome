import { useContext } from 'react'
import { CoreOrganiserContext } from '../datastore/contexts/CoreOrganiserProvider'
import { type IDBOrganiser } from '../datastore/types'
import { getActiveOnly } from '@/lib/getActiveOnly'

export const useOrganisers = ({ activeOnly = true }: {
  activeOnly: boolean
}): IDBOrganiser[] => {
  let { objects } = useContext(CoreOrganiserContext)

  if (activeOnly) {
    objects = getActiveOnly(objects)
  }
  return (objects).sort((a1, a2) => {
    return a1.title.localeCompare(a2.title)
  })
}
