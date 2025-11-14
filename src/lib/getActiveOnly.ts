import type { IDBConcept } from 'src/datastore/types'


export const getActiveOnly = <T extends IDBConcept>(objects: T[]) => {
  const filteredObjects = objects.filter((item) => {
    return item.usableVersion > 0
  })
  return filteredObjects
}
