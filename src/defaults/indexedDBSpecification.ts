/**
 * Specification of which object stores should be created if they don't exist.
 * Any change in the version will cause an upgrade in users browser IndexedDB.
 *
 * If this is used much this could be further enhanced as migration scripts
 * for each version.
 */
export const indexedDBSpecification = {
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
