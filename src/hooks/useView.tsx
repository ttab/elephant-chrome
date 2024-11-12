import { useContext } from 'react'
import { ViewContext } from '@/components/View'
import { type ViewProviderState } from '@/types'

export const useView = (): ViewProviderState => {
  const context = useContext(ViewContext)

  if (context === undefined) {
    throw new Error('useView must be used within a ViewProvider')
  }

  return context
}
