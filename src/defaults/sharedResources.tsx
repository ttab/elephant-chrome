/**
 * Specification of which object stores should be created if they don't exist.
 * Any change in the version will cause an upgrade in users browser IndexedDB.
 *
 * If this is used much this could be further enhanced as migration scripts
 * for each version.
 */
export const IndexedDB = {
  name: 'elephant-db',
  version: 45,
  objectStores: [
    'core/author',
    'core/section',
    'core/story',
    'core/category',
    'core/organiser',
    'tt/wire-source',
    '__meta',
    'languages'
  ]
}

export const SharedSSEWorker = {
  version: 1
}

/**
 * IndexedDB Migration Specification.
 *
 * The number of migrations is equal to the version number. When a database change is
 * needed a new migration callback is added which adds, removes or changes object stores.
 *
 * The migrations will be run sequentially to ensure that an upgrade from older version
 * numbers will work correctly. If the database does not exist all migrations are executed
 * from the start.
 */
export const IndexedDBMigrations = {
  name: 'elephant',
  migrations: [
    (db: IDBDatabase) => {
      db.createObjectStore('__meta', { keyPath: 'id' })
      db.createObjectStore('__languages', { keyPath: 'id' })
    }
  ]
}
