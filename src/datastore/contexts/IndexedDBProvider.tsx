import React, {
  createContext,
  useState,
  useEffect,
  useCallback
} from 'react'

import { CoreAuthorProvider } from './CoreAuthorProvider'
import { CoreStoryProvider } from './CoreStoryProvider'

export interface IndexedDBContextType {
  db: IDBDatabase | null
  put: <T>(storeName: string, value: T, key?: IDBValidKey) => Promise<void>
  get: <T>(storeName: string, key?: IDBValidKey) => Promise<T | undefined>
  clear: (storeName: string) => Promise<void>
}

export const IndexedDBContext = createContext<IndexedDBContextType | undefined>(undefined)

export const IndexedDBProvider = ({ children, name }: {
  children: React.ReactNode
  name: string
}): JSX.Element => {
  const [db, setDb] = useState<IDBDatabase | null>(null)

  // Open (and create if applicable) an indexedDB
  useEffect(() => {
    const indexedDbSpecification = {
      version: 5,
      objectStores: [
        'core/author',
        'core/story',
        '__meta'
      ]
    }
    const openRequest = indexedDB.open(name, indexedDbSpecification.version)

    // FIXME: Upgrade is not done if database is open in another tab
    openRequest.onupgradeneeded = (event) => {
      const target = event.target as IDBOpenDBRequest
      const db = target.result

      for (const storeName of indexedDbSpecification.objectStores) {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' })
        }
      }
    }

    openRequest.onsuccess = (event) => {
      const target = event.target as IDBOpenDBRequest
      setDb(target.result)
    }

    openRequest.onerror = (event) => {
      console.error('Failed to open IndexedDB:', event)
    }

    openRequest.onblocked = (event) => {
      console.error('Blocked upgrade of IndexedDB:', event)
    }
  }, [name])

  // Close DB upon leaving
  useEffect(() => {
    return () => {
      db?.close()
    }
  }, [db])

  const put = useCallback(async function <T>(storeName: string, value: T, key?: IDBValidKey): Promise<void> {
    if (!db) {
      throw new Error('IndexedDB is not initialized')
    }

    await putObject(db, storeName, value, key)
  }, [db])


  const get = useCallback(async function <T>(storeName: string, key?: IDBValidKey): Promise<T | undefined> {
    if (!db) {
      throw new Error('IndexedDB is not initialized')
    }

    return await getObject(db, storeName, key)
  }, [db])


  const clear = useCallback(async (storeName: string): Promise<void> => {
    if (!db) {
      throw new Error('IndexedDB is not initialized')
    }
    await clearObjects(db, storeName)
  }, [db])


  return (
    <IndexedDBContext.Provider value={{ db, put, get, clear }}>
      {!!db &&
        <CoreAuthorProvider>
          <CoreStoryProvider>
            {children}
          </CoreStoryProvider>
        </CoreAuthorProvider>
      }
    </IndexedDBContext.Provider>
  )
}


// Put an object into specified objectStore
async function putObject<T>(db: IDBDatabase, storeName: string, value: T, key?: IDBValidKey): Promise<void> {
  const transaction = db.transaction(storeName, 'readwrite')
  const store = transaction.objectStore(storeName)

  await new Promise<void>((resolve, reject) => {
    const request = store.put(value, key)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error as Error)
  })
}


// Get object/s from store
async function getObject<T>(db: IDBDatabase, storeName: string, key?: IDBValidKey): Promise<T | undefined> {
  const transaction = db.transaction(storeName, 'readonly')
  const store = transaction.objectStore(storeName)

  return await new Promise<T | undefined>((resolve, reject) => {
    const request = key ? store.get(key) : store.getAll()

    request.onsuccess = () => resolve(request.result as T)
    request.onerror = () => reject(request.error as Error)
  })
}


// Clear an object store completely
async function clearObjects(db: IDBDatabase, storeName: string): Promise<void> {
  const transaction = db.transaction(storeName, 'readwrite')
  const store = transaction.objectStore(storeName)

  await new Promise<void>((resolve, reject) => {
    const request = store.clear()

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error as Error)
  })
}
