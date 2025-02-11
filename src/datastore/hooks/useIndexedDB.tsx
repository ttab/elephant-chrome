import { useContext } from 'react'
import {
  IndexedDBContext,
  type IndexedDBContextInterface
} from '../contexts/IndexedDBProvider'

export const useIndexedDB = (): IndexedDBContextInterface => {
  const context = useContext(IndexedDBContext)

  if (context === undefined) {
    throw new Error('useIndexedDB must be used within an IndexedDBProvider')
  }

  return context
}
