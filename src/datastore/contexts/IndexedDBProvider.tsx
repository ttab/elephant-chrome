import React, {
  createContext,
  useState,
  useEffect,
  useCallback
} from 'react'

import { IndexedDB as specification } from '../../defaults/sharedResources'

export interface IndexedDBContextType {
  db: IDBDatabase | null
  put: <T>(storeName: string, value: T, key?: IDBValidKey) => Promise<void>
  get: <T>(storeName: string, key?: IDBValidKey) => Promise<T | undefined>
  clear: (storeName: string) => Promise<void>
}

export const IndexedDBContext = createContext<IndexedDBContextType | undefined>(undefined)

export const IndexedDBProvider = ({ children }: {
  children: React.ReactNode
}): JSX.Element => {
  const [db, setDb] = useState<IDBDatabase | null>(null)

  // Open (and create if applicable) an indexedDB
  useEffect(() => {
    const openRequest = indexedDB.open(specification.name, specification.version)

    openRequest.onupgradeneeded = (event) => {
      const target = event.target as IDBOpenDBRequest
      const db = target.result

      for (const storeName of specification.objectStores) {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' })
        }
      }
    }

    openRequest.onsuccess = (event) => {
      const target = event.target as IDBOpenDBRequest
      setDb(target.result)
    }

    openRequest.onerror = () => {
      console.error('Failed to open database:', openRequest.error)

      // Check for version mismatch
      if (openRequest.error?.name === 'VersionError') {
        console.warn('Version mismatch detected. Resetting database...')
        void resetDatabase(specification.name)
      }
    }

    openRequest.onblocked = (event) => {
      console.error('Blocked upgrade of IndexedDB:', event)
    }
  }, [])

  useEffect(() => {
    if (db) {
      db.onversionchange = () => {
        // Another tab or window have reloaded with a new database version
        // and needs to perform a database update. Close database.
        db.close()
        setDb(null)
      }
    }

    // Close database upon leaving
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
      {children}
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

// Reset database when installed version is higher than application wants
async function resetDatabase(dbName: string) {
  await new Promise<void>((resolve, reject) => {
    const deleteRequest = indexedDB.deleteDatabase(dbName)

    deleteRequest.onsuccess = () => {
      console.log('Database reset successfully')
      resolve()
    }

    deleteRequest.onerror = () => {
      console.error('Failed to delete database:', deleteRequest.error)
      reject(deleteRequest.error || new Error('Unknown error when reseting IndexedDB database'))
    }
  })
}
