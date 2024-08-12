import { useContext } from 'react'
import {
  IndexedDBContext,
  type IndexedDBContextType
} from '../contexts/IndexedDBProvider'

export const useIndexedDB = (): IndexedDBContextType => {
  const context = useContext(IndexedDBContext)

  if (context === undefined) {
    throw new Error('useIndexedDB must be used within an IndexedDBProvider')
  }

  return context
}
