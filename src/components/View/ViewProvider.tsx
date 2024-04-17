import { useNavigation } from '@/hooks'
import { createContext, useMemo } from 'react'
import { type ViewProviderState } from '@/types'

interface ViewProviderProps {
  viewId: string
  name: string
  children: React.ReactNode
}

const initialState = {
  viewId: '',
  name: '',
  isActive: false,
  isFocused: false,
  isHidden: false
}

const ViewContext = createContext<ViewProviderState>(initialState)

const ViewProvider = ({ viewId, name, children }: ViewProviderProps): JSX.Element => {
  const { state: navigationState } = useNavigation()

  const value = useMemo((): ViewProviderState => {
    return {
      viewId,
      name,
      isActive: navigationState.active === viewId,
      isFocused: navigationState.focus === viewId,
      isHidden: !!navigationState.focus && navigationState.focus !== viewId
    }
  }, [viewId, name, navigationState.active, navigationState.focus])

  return (
    <ViewContext.Provider value={value}>
      {children}
    </ViewContext.Provider>
  )
}

export { ViewContext, ViewProvider }
