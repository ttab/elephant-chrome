import { useNavigation } from '@/hooks'
import { createContext, useMemo } from 'react'
import { type ViewProviderState } from '@/types'

interface ViewProviderProps {
  id: string
  name: string
  children: React.ReactNode
}

export const ViewContext = createContext<ViewProviderState>({
  id: '',
  name: '',
  isActiveView: false
})

export const ViewProvider = ({ id, name, children }: ViewProviderProps): JSX.Element => {
  const { state: navigationState } = useNavigation()

  const value = useMemo((): ViewProviderState => {
    return {
      id,
      name,
      isActiveView: navigationState.active === id
    }
  }, [id, name, navigationState.active])

  return (
    <ViewContext.Provider value={value}>
      {children}
    </ViewContext.Provider>
  )
}
