import { useNavigation } from '@/hooks'
import { createContext, useMemo } from 'react'
import { type ViewProviderState } from '@/types'

interface ViewProviderProps {
  id: string
  name: string
  children: React.ReactNode
}

const initialState = {
  id: '',
  name: '',
  isActive: false,
  isFocused: false
}

const ViewContext = createContext<ViewProviderState>(initialState)

const ViewProvider = ({ id, name, children }: ViewProviderProps): JSX.Element => {
  const { state: navigationState } = useNavigation()

  const value = useMemo((): ViewProviderState => {
    return {
      id,
      name,
      isActive: navigationState.active === id,
      isFocused: navigationState.focus === id
    }
  }, [id, name, navigationState.active, navigationState.focus])

  return (
    <ViewContext.Provider value={value}>
      {children}
    </ViewContext.Provider>
  )
}

export { ViewContext, ViewProvider }
