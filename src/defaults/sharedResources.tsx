import type { IndexedDBSpecification } from '@/lib/IndexedDBConnection'


export const SharedSSEWorker = {
  version: 1
}

/**
 * IndexedDB Migration Specification.
 *
 * The migrations will be run sequentially to ensure that an upgrade from older
 * versions work correctly. If the database does not exist, all migrations are
 * executed from the start.
 */
export const IndexedDBDefinition: IndexedDBSpecification = {
  name: 'elephant',
  migrations: [
    (db) => {
      db.createObjectStore('__meta', { keyPath: 'id' })
      db.createObjectStore('languages', { keyPath: 'id' })
      db.createObjectStore('core/author', { keyPath: 'id' })
      db.createObjectStore('core/section', { keyPath: 'id' })
      db.createObjectStore('core/story', { keyPath: 'id' })
      db.createObjectStore('core/category', { keyPath: 'id' })
      db.createObjectStore('core/organiser', { keyPath: 'id' })
      db.createObjectStore('tt/wire-source', { keyPath: 'id' })
    }
  ]
}
