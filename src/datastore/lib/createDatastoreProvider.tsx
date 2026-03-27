import { createContext, useCallback, useEffect, useState, type JSX } from 'react'
import { useRegistry, useRepositoryEvents } from '@/hooks'
import { useSession } from 'next-auth/react'
import { useIndexedDB } from '../hooks/useIndexedDB'
import { fetchOrRefresh } from './fetchOrRefresh'
import type { HitV1 } from '@ttab/elephant-api/index'

interface DatastoreProviderState<T extends { id: string }> {
  objects: T[]
}

interface DatastoreProviderConfig<T extends { id: string }> {
  documentType: string
  fields: string[]
  transformer: (hit: HitV1) => T
}

export function createDatastoreProvider<T extends { id: string }>(config: DatastoreProviderConfig<T>): {
  Context: React.Context<DatastoreProviderState<T>>
  Provider: ({ children }: { children: React.ReactNode }) => JSX.Element
} {
  const Context = createContext<DatastoreProviderState<T>>({ objects: [] })

  const Provider = ({ children }: { children: React.ReactNode }): JSX.Element => {
    const { index } = useRegistry()
    const { data } = useSession()
    const [objects, setObjects] = useState<T[]>([])
    const IDB = useIndexedDB()

    const getOrRefreshCache = useCallback(async (force: boolean = false): Promise<void> => {
      if (!data?.accessToken || !index || !IDB.isConnected) {
        return
      }

      const cachedObjects = await fetchOrRefresh<T>(
        IDB,
        config.documentType,
        index,
        data.accessToken,
        force,
        config.fields,
        config.transformer
      )

      if (Array.isArray(cachedObjects) && cachedObjects.length) {
        setObjects(cachedObjects)
      }
    }, [data?.accessToken, index, IDB])

    useEffect(() => {
      getOrRefreshCache().catch((ex) => {
        console.error(ex)
      })
    }, [getOrRefreshCache])

    useRepositoryEvents(config.documentType, () => {
      getOrRefreshCache(true).catch((ex) => {
        console.error(`[${config.documentType}] Cache refresh failed:`, ex)
      })
    })

    return (
      <Context.Provider value={{ objects }}>
        {children}
      </Context.Provider>
    )
  }

  return { Context, Provider }
}
