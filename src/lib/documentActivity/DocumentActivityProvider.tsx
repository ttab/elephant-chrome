import { type JSX, type PropsWithChildren, useMemo, useSyncExternalStore } from 'react'
import { documentActivityRegistry } from './registry'
import { DocumentActivityContext, type DocumentActivityContextValue } from './documentActivityContext'

export const DocumentActivityProvider = ({ children }: PropsWithChildren): JSX.Element => {
  const version = useSyncExternalStore(
    documentActivityRegistry.subscribe,
    documentActivityRegistry.getVersion
  )

  const value = useMemo<DocumentActivityContextValue>(() => ({
    register: documentActivityRegistry.register,
    getEntries: documentActivityRegistry.getEntries,
    version
  }), [version])

  return (
    <DocumentActivityContext.Provider value={value}>
      {children}
    </DocumentActivityContext.Provider>
  )
}
