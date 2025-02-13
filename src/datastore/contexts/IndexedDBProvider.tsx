import { createContext, useCallback, useEffect, useState } from 'react'
import { IndexedDBConnection } from '@/lib/IndexedDBConnection'
import { IndexedDBDefinition } from '../../defaults/sharedResources'

export interface IndexedDBContextInterface {
  isConnected: boolean
  put: <T>(storeName: string, value: T, key?: IDBValidKey) => Promise<void>
  get: <T>(storeName: string, key?: IDBValidKey) => Promise<T | undefined>
  clear: (storeName: string) => Promise<void>
}

export const IndexedDBContext = createContext<IndexedDBContextInterface>({
  isConnected: false,
  put: async () => { return Promise.reject(new Error('IndexedDB not ready')) },
  get: async () => { return Promise.reject(new Error('IndexedDB not ready')) },
  clear: async () => { return Promise.reject(new Error('IndexedDB not ready')) }
})

export function IndexedDBProvider({ children }: { children: React.ReactNode }) {
  const [idb] = useState<IndexedDBConnection>(new IndexedDBConnection(IndexedDBDefinition))
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    idb.onVersionChange = () => {
      // Allow others to upgrade
      setIsConnected(false)
    }

    idb.open().then(() => {
      setIsConnected(true)
    }).catch((_) => {
      setIsConnected(false)
    })

    return () => {
      idb.close()
    }
  }, [idb])

  const put = useCallback(async function <T>(storeName: string, value: T, key?: IDBValidKey): Promise<void> {
    await idb.putObject(storeName, value, key)
  }, [idb])


  const get = useCallback(async function <T>(storeName: string, key?: IDBValidKey): Promise<T | undefined> {
    return await idb.getObject(storeName, key)
  }, [idb])


  const clear = useCallback(async (storeName: string): Promise<void> => {
    await idb.clearObjects(storeName)
  }, [idb])

  return (
    <IndexedDBContext.Provider value={{ isConnected, put, get, clear }}>
      {children}
    </IndexedDBContext.Provider>
  )
}
