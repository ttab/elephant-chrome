import { createContext, useEffect, useRef, useState } from 'react'
import { IndexedDBConnection } from '@/lib/IndexedDBConnection'
import { IndexedDBMigrations } from '../../defaults/sharedResources'

export interface IDBContextType {
  db: IDBDatabase | null
  name: string
  version: number
}

export const IDBContext = createContext<IDBContextType>({
  db: null,
  name: '',
  version: 0
})

export function IDBProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<IDBDatabase | null>(null)
  const dbConnectionRef = useRef<IndexedDBConnection | null>(null)

  useEffect(() => {
    if (!dbConnectionRef.current) {
      dbConnectionRef.current = new IndexedDBConnection(
        IndexedDBMigrations.name,
        IndexedDBMigrations.migrations.length // Equals the version
      )

      dbConnectionRef.current.onUpgradeNeeded = (db, fromVersion) => {
        for (const migrate of IndexedDBMigrations.migrations.slice(fromVersion)) {
          migrate(db)
        }
      }

      // Handle version changes
      dbConnectionRef.current.onVersionChange = () => {
        setDb(null)
      }
    }

    dbConnectionRef.current.open().then(setDb).catch(console.error)
  }, [])

  useEffect(() => {
    return () => {
      db?.close() // Cleanup on unmount
    }
  }, [db])

  return (
    <IDBContext.Provider value={{
      db,
      version: dbConnectionRef.current?.version ?? 0,
      name: dbConnectionRef.current?.name || ''
    }}
    >
      {children}
    </IDBContext.Provider>
  )
}
