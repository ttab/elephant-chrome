import { useContext } from 'react'
import { SharedWorkerContext } from '@/contexts/SharedWorkerProvider'

export const useSharedWorker = () => {
  const context = useContext(SharedWorkerContext)

  if (!context) {
    throw new Error('useSharedWorker must be used within a SharedWorkerProvider')
  }

  return context
}
